-- MÓDULO DE SERVICIOS AUTOLOCK
-- Crear enum para tipos de combustible
DO $$ BEGIN
  CREATE TYPE combustible_type AS ENUM (
    'bencina',
    'diesel',
    'electrico',
    'hibrido',
    'cualquiera'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extender tabla services existente
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id),
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS solo_cotizable_externo BOOLEAN DEFAULT false;

-- Hacer tiempo_estimado_minutos obligatorio
ALTER TABLE services 
  ALTER COLUMN tiempo_estimado_minutos SET NOT NULL,
  ALTER COLUMN tiempo_estimado_minutos SET DEFAULT 60;

-- Constraints en services
DO $$ BEGIN
  ALTER TABLE services ADD CONSTRAINT services_tiempo_min CHECK (tiempo_estimado_minutos >= 15);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE services ADD CONSTRAINT services_precio_positivo CHECK (precio_base >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extender tabla services_products
ALTER TABLE services_products
  ADD COLUMN IF NOT EXISTS es_sustituible BOOLEAN DEFAULT false;

DO $$ BEGIN
  ALTER TABLE services_products ADD CONSTRAINT services_products_cantidad_positiva CHECK (cantidad > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tabla service_checklist_items
CREATE TABLE IF NOT EXISTS service_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  orden INT NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  obligatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, orden)
);

CREATE INDEX IF NOT EXISTS idx_service_checklist_service_id ON service_checklist_items(service_id);
CREATE INDEX IF NOT EXISTS idx_service_checklist_orden ON service_checklist_items(service_id, orden);

-- Crear tabla service_compat_rules
CREATE TABLE IF NOT EXISTS service_compat_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  combustible combustible_type DEFAULT 'cualquiera',
  anio_min INT,
  anio_max INT,
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT compat_anios_logicos CHECK (
    (anio_min IS NULL AND anio_max IS NULL) OR
    (anio_min IS NULL AND anio_max IS NOT NULL) OR
    (anio_max IS NULL AND anio_min IS NOT NULL) OR
    (anio_min <= anio_max)
  )
);

CREATE INDEX IF NOT EXISTS idx_service_compat_service_id ON service_compat_rules(service_id);

-- Crear vista materializada service_usage_stats
DROP MATERIALIZED VIEW IF EXISTS service_usage_stats CASCADE;
CREATE MATERIALIZED VIEW service_usage_stats AS
SELECT 
  wi.ref_id AS service_id,
  COUNT(DISTINCT wo.id) AS ots_periodo,
  COALESCE(AVG(wo.duracion_minutos)::INT, 0) AS tiempo_promedio_real_min,
  COUNT(CASE WHEN wo.estado = 'reprogramada' THEN 1 END) AS reprogramadas,
  CASE 
    WHEN COUNT(DISTINCT wo.id) > 0 THEN
      ROUND(
        (COUNT(CASE WHEN wo.estado = 'completada' THEN 1 END)::NUMERIC / COUNT(DISTINCT wo.id)::NUMERIC) * 100,
        2
      )
    ELSE 0
  END AS ftf_pct
FROM wo_items wi
JOIN work_orders wo ON wo.id = wi.wo_id
WHERE wi.item_tipo = 'servicio'
  AND wi.ref_id IS NOT NULL
  AND wo.fecha_programada >= NOW() - INTERVAL '30 days'
GROUP BY wi.ref_id;

CREATE UNIQUE INDEX idx_service_usage_stats_service_id 
  ON service_usage_stats(service_id);

-- Función is_service_compatible
CREATE OR REPLACE FUNCTION is_service_compatible(
  p_vehicle_id UUID,
  p_service_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_combustible TEXT;
  v_anio INT;
  v_compatible BOOLEAN := false;
  v_has_rules BOOLEAN := false;
BEGIN
  SELECT combustible, anio 
  INTO v_combustible, v_anio
  FROM vehicles
  WHERE id = p_vehicle_id;
  
  IF v_combustible IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM service_compat_rules WHERE service_id = p_service_id
  ) INTO v_has_rules;
  
  IF NOT v_has_rules THEN
    RETURN true;
  END IF;
  
  SELECT EXISTS(
    SELECT 1
    FROM service_compat_rules
    WHERE service_id = p_service_id
      AND (
        combustible = 'cualquiera' 
        OR combustible::TEXT = LOWER(v_combustible)
      )
      AND (anio_min IS NULL OR v_anio >= anio_min)
      AND (anio_max IS NULL OR v_anio <= anio_max)
  ) INTO v_compatible;
  
  RETURN v_compatible;
END;
$$;

-- Función refresh_service_usage_stats
CREATE OR REPLACE FUNCTION refresh_service_usage_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY service_usage_stats;
END;
$$;

-- Función reservar_materiales_servicio
CREATE OR REPLACE FUNCTION reservar_materiales_servicio(
  p_wo_id UUID,
  p_service_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_material RECORD;
  v_tecnico_location UUID;
  v_bodega_location UUID;
  v_branch_id UUID;
  v_tecnico_id UUID;
BEGIN
  SELECT branch_id, tecnico_id INTO v_branch_id, v_tecnico_id
  FROM work_orders WHERE id = p_wo_id;
  
  IF v_tecnico_id IS NULL THEN
    RAISE EXCEPTION 'OT no tiene técnico asignado';
  END IF;
  
  SELECT id INTO v_bodega_location
  FROM stock_locations
  WHERE tipo = 'bodega' AND branch_id = v_branch_id AND activa = true
  LIMIT 1;
  
  IF v_bodega_location IS NULL THEN
    RAISE EXCEPTION 'No hay bodega activa en la sucursal';
  END IF;
  
  SELECT id INTO v_tecnico_location
  FROM stock_locations
  WHERE tipo = 'camioneta' AND activa = true
  LIMIT 1;
  
  IF v_tecnico_location IS NULL THEN
    RAISE EXCEPTION 'No hay ubicación de camioneta disponible';
  END IF;
  
  FOR v_material IN 
    SELECT product_id, cantidad, es_sustituible
    FROM services_products
    WHERE service_id = p_service_id
  LOOP
    INSERT INTO stock_moves (
      tipo, product_id, cantidad, 
      from_location_id, to_location_id,
      referencia, user_id
    )
    SELECT 
      'reserva', v_material.product_id, v_material.cantidad,
      v_bodega_location, v_tecnico_location,
      'OT-' || wo.folio || ' (Servicio)',
      v_tecnico_id
    FROM work_orders wo WHERE wo.id = p_wo_id;
  END LOOP;
END;
$$;

-- Función obtener_top_servicios
CREATE OR REPLACE FUNCTION obtener_top_servicios(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_branch_id UUID DEFAULT NULL,
  p_order_by TEXT DEFAULT 'cantidad',
  p_limit INT DEFAULT 5
)
RETURNS TABLE(
  service_id UUID,
  nombre TEXT,
  cantidad BIGINT,
  monto NUMERIC
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wi.ref_id,
    s.nombre,
    SUM(wi.cantidad)::BIGINT as cantidad,
    SUM(wi.cantidad * wi.precio_unitario) as monto
  FROM wo_items wi
  JOIN work_orders wo ON wo.id = wi.wo_id
  JOIN services s ON s.id = wi.ref_id
  WHERE wi.item_tipo = 'servicio'
    AND wi.ref_id IS NOT NULL
    AND wo.fecha_programada::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
  GROUP BY wi.ref_id, s.nombre
  ORDER BY 
    CASE 
      WHEN p_order_by = 'cantidad' THEN SUM(wi.cantidad)
      WHEN p_order_by = 'monto' THEN SUM(wi.cantidad * wi.precio_unitario)
    END DESC
  LIMIT p_limit;
END;
$$;

-- Trigger para auditoría
CREATE OR REPLACE FUNCTION audit_services_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_nuevos)
    VALUES ('services', NEW.id, 'INSERT', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores, datos_nuevos)
    VALUES ('services', NEW.id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores)
    VALUES ('services', OLD.id, 'DELETE', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_services ON services;
CREATE TRIGGER trigger_audit_services
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION audit_services_changes();

-- Habilitar RLS
ALTER TABLE service_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_compat_rules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Admin: gestiona servicios" ON services;
CREATE POLICY "Admin: gestiona servicios"
  ON services FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Operador/Vendedor: ve servicios activos" ON services;
CREATE POLICY "Operador/Vendedor: ve servicios activos"
  ON services FOR SELECT
  TO authenticated
  USING (
    activo = true 
    AND (
      has_role(auth.uid(), 'operador') 
      OR has_role(auth.uid(), 'vendedor')
      OR has_role(auth.uid(), 'admin')
    )
  );

DROP POLICY IF EXISTS "Técnico: ve servicios activos" ON services;
CREATE POLICY "Técnico: ve servicios activos"
  ON services FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'tecnico') 
    AND activo = true
  );

DROP POLICY IF EXISTS "Admin: gestiona checklist items" ON service_checklist_items;
CREATE POLICY "Admin: gestiona checklist items"
  ON service_checklist_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuarios: ven checklist items" ON service_checklist_items;
CREATE POLICY "Usuarios: ven checklist items"
  ON service_checklist_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin: gestiona reglas compatibilidad" ON service_compat_rules;
CREATE POLICY "Admin: gestiona reglas compatibilidad"
  ON service_compat_rules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuarios: ven reglas compatibilidad" ON service_compat_rules;
CREATE POLICY "Usuarios: ven reglas compatibilidad"
  ON service_compat_rules FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin: gestiona services_products" ON services_products;
CREATE POLICY "Admin: gestiona services_products"
  ON services_products FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuarios: ven services_products" ON services_products;
CREATE POLICY "Usuarios: ven services_products"
  ON services_products FOR SELECT
  TO authenticated
  USING (true);

-- Insertar setting para URL de ADVANCE
INSERT INTO settings (clave, valor, descripcion, tipo_dato)
VALUES (
  'advance_cotizar_url',
  'https://formulario-advance.autolock.cl',
  'URL del formulario externo para cotizar servicio ADVANCE',
  'text'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;