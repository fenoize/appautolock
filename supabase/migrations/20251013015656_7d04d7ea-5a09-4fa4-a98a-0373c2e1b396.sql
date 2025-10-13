-- Expandir enum wo_status con nuevos estados
ALTER TYPE wo_status ADD VALUE IF NOT EXISTS 'pendiente';
ALTER TYPE wo_status ADD VALUE IF NOT EXISTS 'asignada';
ALTER TYPE wo_status ADD VALUE IF NOT EXISTS 'pausada';
ALTER TYPE wo_status ADD VALUE IF NOT EXISTS 'reprogramada';

-- Agregar columnas a work_orders para cierre de OT
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS checklist_data JSONB,
ADD COLUMN IF NOT EXISTS evidencias_urls TEXT[],
ADD COLUMN IF NOT EXISTS firma_url TEXT,
ADD COLUMN IF NOT EXISTS firma_nombre TEXT,
ADD COLUMN IF NOT EXISTS fecha_inicio_real TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fecha_fin_real TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER,
ADD COLUMN IF NOT EXISTS observaciones_cierre TEXT,
ADD COLUMN IF NOT EXISTS pdf_informe_url TEXT,
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id),
ADD COLUMN IF NOT EXISTS inventario_reservado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS inventario_consumido BOOLEAN DEFAULT FALSE;

-- Tabla de plantillas de checklist por servicio
CREATE TABLE IF NOT EXISTS wo_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_service ON wo_checklist_templates(service_id);

-- Tabla de sustituciones de productos en OT
CREATE TABLE IF NOT EXISTS wo_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  producto_original_id UUID REFERENCES products(id) NOT NULL,
  producto_sustituto_id UUID REFERENCES products(id) NOT NULL,
  cantidad NUMERIC NOT NULL,
  razon TEXT,
  autorizado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_substitutions_wo ON wo_substitutions(wo_id);

-- Función para calcular duración de OT
CREATE OR REPLACE FUNCTION calcular_duracion_wo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_fin_real IS NOT NULL AND NEW.fecha_inicio_real IS NOT NULL THEN
    NEW.duracion_minutos := EXTRACT(EPOCH FROM (NEW.fecha_fin_real - NEW.fecha_inicio_real)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_duracion_wo ON work_orders;
CREATE TRIGGER trigger_calcular_duracion_wo
BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION calcular_duracion_wo();

-- Función para reservar inventario de OT
CREATE OR REPLACE FUNCTION reservar_inventario_wo(p_wo_id UUID)
RETURNS void AS $$
DECLARE
  v_item RECORD;
  v_tecnico_location UUID;
  v_bodega_location UUID;
  v_branch_id UUID;
  v_tecnico_id UUID;
BEGIN
  -- Obtener branch_id y tecnico_id de la OT
  SELECT branch_id, tecnico_id INTO v_branch_id, v_tecnico_id
  FROM work_orders WHERE id = p_wo_id;
  
  IF v_tecnico_id IS NULL THEN
    RAISE EXCEPTION 'OT no tiene técnico asignado';
  END IF;

  -- Obtener ubicación de bodega de la sucursal
  SELECT id INTO v_bodega_location
  FROM stock_locations
  WHERE tipo = 'bodega' AND branch_id = v_branch_id AND activa = true
  LIMIT 1;
  
  IF v_bodega_location IS NULL THEN
    RAISE EXCEPTION 'No hay bodega activa en la sucursal';
  END IF;

  -- Obtener ubicación de stock del técnico (camioneta)
  SELECT id INTO v_tecnico_location
  FROM stock_locations
  WHERE tipo = 'camioneta' AND activa = true
  LIMIT 1;

  IF v_tecnico_location IS NULL THEN
    RAISE EXCEPTION 'No hay ubicación de camioneta disponible';
  END IF;

  -- Crear movimientos de reserva para cada producto
  FOR v_item IN 
    SELECT wi.ref_id as product_id, wi.cantidad
    FROM wo_items wi
    WHERE wi.wo_id = p_wo_id AND wi.item_tipo = 'producto' AND wi.ref_id IS NOT NULL
  LOOP
    INSERT INTO stock_moves (
      tipo, product_id, cantidad, 
      from_location_id, to_location_id,
      referencia, user_id
    )
    SELECT 
      'reserva', v_item.product_id, v_item.cantidad,
      v_bodega_location,
      v_tecnico_location,
      'OT-' || wo.folio,
      v_tecnico_id
    FROM work_orders wo WHERE wo.id = p_wo_id;
  END LOOP;

  -- Marcar como reservado
  UPDATE work_orders SET inventario_reservado = TRUE WHERE id = p_wo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para consumir inventario al cerrar OT
CREATE OR REPLACE FUNCTION consumir_inventario_wo(p_wo_id UUID)
RETURNS void AS $$
DECLARE
  v_item RECORD;
  v_tecnico_location UUID;
  v_tecnico_id UUID;
BEGIN
  -- Obtener tecnico_id
  SELECT tecnico_id INTO v_tecnico_id FROM work_orders WHERE id = p_wo_id;

  -- Obtener ubicación de stock del técnico
  SELECT id INTO v_tecnico_location
  FROM stock_locations
  WHERE tipo = 'camioneta' AND activa = true
  LIMIT 1;

  IF v_tecnico_location IS NULL THEN
    RAISE EXCEPTION 'No se encontró ubicación de camioneta';
  END IF;

  -- Crear movimientos de consumo para cada producto
  FOR v_item IN 
    SELECT wi.ref_id as product_id, wi.cantidad
    FROM wo_items wi
    WHERE wi.wo_id = p_wo_id AND wi.item_tipo = 'producto' AND wi.ref_id IS NOT NULL
  LOOP
    INSERT INTO stock_moves (
      tipo, product_id, cantidad,
      from_location_id, referencia, user_id
    )
    SELECT 
      'consumo', v_item.product_id, v_item.cantidad,
      v_tecnico_location,
      'OT-' || wo.folio,
      v_tecnico_id
    FROM work_orders wo WHERE wo.id = p_wo_id;
  END LOOP;

  -- Marcar como consumido
  UPDATE work_orders SET inventario_consumido = TRUE WHERE id = p_wo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS para wo_checklist_templates
ALTER TABLE wo_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: gestiona checklist templates"
ON wo_checklist_templates FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos ven checklist templates"
ON wo_checklist_templates FOR SELECT
USING (true);

-- RLS para wo_substitutions
ALTER TABLE wo_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: total acceso a sustituciones"
ON wo_substitutions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Técnico: crea sustituciones en sus OTs"
ON wo_substitutions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tecnico') AND
  wo_id IN (SELECT id FROM work_orders WHERE tecnico_id = auth.uid())
);

CREATE POLICY "Técnico: ve sustituciones de sus OTs"
ON wo_substitutions FOR SELECT
USING (
  has_role(auth.uid(), 'tecnico') AND
  wo_id IN (SELECT id FROM work_orders WHERE tecnico_id = auth.uid())
);

CREATE POLICY "Operador: ve sustituciones de su branch"
ON wo_substitutions FOR SELECT
USING (
  has_role(auth.uid(), 'operador') AND
  wo_id IN (SELECT id FROM work_orders WHERE branch_id = get_user_branch(auth.uid()))
);

-- Crear storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('wo-evidencias', 'wo-evidencias', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('wo-informes', 'wo-informes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para wo-evidencias
CREATE POLICY "Técnicos suben evidencias de sus OTs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wo-evidencias' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM work_orders WHERE tecnico_id = auth.uid()
  )
);

CREATE POLICY "Todos leen evidencias"
ON storage.objects FOR SELECT
USING (bucket_id = 'wo-evidencias');

-- RLS para wo-informes
CREATE POLICY "Todos leen informes"
ON storage.objects FOR SELECT
USING (bucket_id = 'wo-informes');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_work_orders_tecnico ON work_orders(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_estado ON work_orders(estado);
CREATE INDEX IF NOT EXISTS idx_work_orders_fecha_programada ON work_orders(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_work_orders_branch ON work_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_quote ON work_orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_wo_items_wo ON wo_items(wo_id);

-- Trigger para auditoría de work_orders
CREATE OR REPLACE FUNCTION audit_work_orders_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_nuevos)
    VALUES ('work_orders', NEW.id, 'INSERT', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores, datos_nuevos)
    VALUES ('work_orders', NEW.id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores)
    VALUES ('work_orders', OLD.id, 'DELETE', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_work_orders_trigger ON work_orders;
CREATE TRIGGER audit_work_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON work_orders
FOR EACH ROW EXECUTE FUNCTION audit_work_orders_changes();