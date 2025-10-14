-- Fase 1: Extensión del Modelo de Datos

-- 1. Extender tabla products con campos de suscripción
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS requiere_suscripcion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipos_suscripcion_disponibles JSONB DEFAULT '[]'::jsonb;

-- 2. Extender tabla services con campos de suscripción
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS requiere_suscripcion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipos_suscripcion_disponibles JSONB DEFAULT '[]'::jsonb;

-- 3. Agregar nuevo estado a quote_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'en_revision' 
    AND enumtypid = 'quote_status'::regtype
  ) THEN
    ALTER TYPE quote_status ADD VALUE 'en_revision';
  END IF;
END $$;

-- 4. Extender tabla quotes
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS comprobante_pago_url TEXT,
ADD COLUMN IF NOT EXISTS metodo_aprobacion TEXT CHECK (metodo_aprobacion IN ('email', 'manual'));

-- 5. Extender tabla work_orders
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS puede_editar BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS alertas_stock JSONB DEFAULT '[]'::jsonb;

-- 6. Crear tabla wo_subscription_items
CREATE TABLE IF NOT EXISTS wo_subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  item_tipo TEXT NOT NULL CHECK (item_tipo IN ('servicio', 'producto')),
  ref_id UUID,
  nombre TEXT NOT NULL,
  requiere_suscripcion BOOLEAN DEFAULT false,
  subscription_id UUID REFERENCES subscriptions(id),
  numeros_serie JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para wo_subscription_items
CREATE INDEX IF NOT EXISTS idx_wo_subscription_items_wo_id ON wo_subscription_items(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_subscription_items_subscription_id ON wo_subscription_items(subscription_id);

-- 7. Extender tabla subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS wo_id UUID REFERENCES work_orders(id),
ADD COLUMN IF NOT EXISTS numeros_serie JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_subscriptions_wo_id ON subscriptions(wo_id);

-- 8. Función para convertir cotización a OT (versión 2)
CREATE OR REPLACE FUNCTION convert_quote_to_wo_v2(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote RECORD;
  v_wo_id UUID;
  v_item RECORD;
  v_folio TEXT;
  v_stock_alerts JSONB := '[]'::JSONB;
  v_product RECORD;
  v_service RECORD;
  v_stock_actual NUMERIC;
BEGIN
  -- Obtener datos de la cotización
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotización no encontrada';
  END IF;
  
  -- Validar estado
  IF v_quote.estado != 'aceptada' THEN
    RAISE EXCEPTION 'Solo se pueden convertir cotizaciones aceptadas. Estado actual: %', v_quote.estado;
  END IF;
  
  -- Validar que tenga vehículo asignado
  IF v_quote.vehicle_id IS NULL THEN
    RAISE EXCEPTION 'La cotización debe tener un vehículo asignado antes de convertirse en OT';
  END IF;
  
  -- Generar folio para la OT
  v_folio := generar_folio('OT');
  
  -- Crear Work Order
  INSERT INTO work_orders (
    folio,
    client_id,
    vehicle_id,
    branch_id,
    quote_id,
    notas,
    estado,
    inventario_reservado,
    inventario_consumido,
    puede_editar,
    alertas_stock
  )
  VALUES (
    v_folio,
    v_quote.client_id,
    v_quote.vehicle_id,
    v_quote.branch_id,
    p_quote_id,
    'Generada desde cotización ' || v_quote.folio,
    'pendiente',
    false,
    false,
    true,
    '[]'::jsonb
  )
  RETURNING id INTO v_wo_id;
  
  -- Copiar items de cotización a OT y verificar stock
  FOR v_item IN 
    SELECT * FROM quote_items WHERE quote_id = p_quote_id
  LOOP
    -- Insertar item en wo_items
    INSERT INTO wo_items (
      wo_id,
      item_tipo,
      ref_id,
      nombre,
      cantidad,
      precio_unitario
    )
    VALUES (
      v_wo_id,
      v_item.item_tipo,
      v_item.ref_id,
      v_item.nombre,
      v_item.cantidad,
      v_item.precio_unitario
    );
    
    -- Verificar si es producto y tiene suscripción
    IF v_item.item_tipo = 'producto' AND v_item.ref_id IS NOT NULL THEN
      SELECT * INTO v_product FROM products WHERE id = v_item.ref_id;
      
      IF v_product.requiere_suscripcion THEN
        INSERT INTO wo_subscription_items (
          wo_id,
          item_tipo,
          ref_id,
          nombre,
          requiere_suscripcion
        )
        VALUES (
          v_wo_id,
          'producto',
          v_item.ref_id,
          v_item.nombre,
          true
        );
      END IF;
      
      -- Verificar stock disponible en bodega de la sucursal
      SELECT COALESCE(stock_actual, 0) INTO v_stock_actual
      FROM stock_by_location sbl
      JOIN stock_locations sl ON sl.id = sbl.location_id
      WHERE sbl.product_id = v_item.ref_id
        AND sl.branch_id = v_quote.branch_id
        AND sl.tipo = 'bodega'
        AND sl.activa = true
      LIMIT 1;
      
      -- Si no hay stock suficiente, agregar alerta
      IF v_stock_actual < v_item.cantidad THEN
        v_stock_alerts := v_stock_alerts || jsonb_build_object(
          'producto_id', v_item.ref_id,
          'nombre', v_item.nombre,
          'cantidad_requerida', v_item.cantidad,
          'stock_disponible', v_stock_actual,
          'faltante', v_item.cantidad - v_stock_actual
        );
      END IF;
    END IF;
    
    -- Verificar si es servicio y tiene suscripción
    IF v_item.item_tipo = 'servicio' AND v_item.ref_id IS NOT NULL THEN
      SELECT * INTO v_service FROM services WHERE id = v_item.ref_id;
      
      IF v_service.requiere_suscripcion THEN
        INSERT INTO wo_subscription_items (
          wo_id,
          item_tipo,
          ref_id,
          nombre,
          requiere_suscripcion
        )
        VALUES (
          v_wo_id,
          'servicio',
          v_item.ref_id,
          v_item.nombre,
          true
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Actualizar alertas de stock en la OT
  IF jsonb_array_length(v_stock_alerts) > 0 THEN
    UPDATE work_orders 
    SET alertas_stock = v_stock_alerts 
    WHERE id = v_wo_id;
  END IF;
  
  -- Actualizar estado de cotización
  UPDATE quotes
  SET estado = 'convertida_ot',
      updated_at = now()
  WHERE id = p_quote_id;
  
  -- Registrar evento en auditoría
  INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_nuevos)
  VALUES ('work_orders', v_wo_id, 'INSERT', auth.uid(), 
          jsonb_build_object('origen', 'cotizacion', 'quote_id', p_quote_id));
  
  RETURN v_wo_id;
END;
$$;

-- 9. Función para crear suscripciones desde OT completada
CREATE OR REPLACE FUNCTION create_subscription_from_wo_item(
  p_wo_subscription_item_id UUID,
  p_plan_id UUID,
  p_numeros_serie JSONB,
  p_fecha_inicio DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_wo RECORD;
  v_plan RECORD;
  v_subscription_id UUID;
  v_folio TEXT;
  v_fecha_inicio DATE;
  v_fecha_vencimiento DATE;
BEGIN
  -- Obtener item de suscripción
  SELECT * INTO v_item 
  FROM wo_subscription_items 
  WHERE id = p_wo_subscription_item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item de suscripción no encontrado';
  END IF;
  
  -- Verificar que no tenga suscripción ya creada
  IF v_item.subscription_id IS NOT NULL THEN
    RAISE EXCEPTION 'Este item ya tiene una suscripción asociada';
  END IF;
  
  -- Obtener datos de la OT
  SELECT * INTO v_wo FROM work_orders WHERE id = v_item.wo_id;
  
  IF v_wo.estado != 'completada' THEN
    RAISE EXCEPTION 'Solo se pueden crear suscripciones de OTs completadas';
  END IF;
  
  -- Obtener datos del plan
  SELECT * INTO v_plan FROM subscription_plans WHERE id = p_plan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan de suscripción no encontrado';
  END IF;
  
  -- Calcular fechas
  v_fecha_inicio := COALESCE(p_fecha_inicio, v_wo.fecha_fin_real::DATE, CURRENT_DATE);
  v_fecha_vencimiento := v_fecha_inicio + (v_plan.periodo_meses || ' months')::INTERVAL;
  
  -- Generar folio
  v_folio := generar_folio('SUB');
  
  -- Crear suscripción
  INSERT INTO subscriptions (
    folio,
    client_id,
    vehicle_id,
    plan_id,
    wo_id,
    estado,
    fecha_inicio,
    fecha_vencimiento,
    numeros_serie,
    notas
  )
  VALUES (
    v_folio,
    v_wo.client_id,
    v_wo.vehicle_id,
    p_plan_id,
    v_item.wo_id,
    'activa',
    v_fecha_inicio,
    v_fecha_vencimiento,
    p_numeros_serie,
    'Suscripción generada desde OT ' || v_wo.folio || ' - Item: ' || v_item.nombre
  )
  RETURNING id INTO v_subscription_id;
  
  -- Actualizar wo_subscription_item con la suscripción creada
  UPDATE wo_subscription_items
  SET subscription_id = v_subscription_id,
      numeros_serie = p_numeros_serie
  WHERE id = p_wo_subscription_item_id;
  
  -- Crear evento de alta
  INSERT INTO subscription_events (
    subscription_id,
    tipo,
    notas,
    user_id
  )
  VALUES (
    v_subscription_id,
    'alta',
    'Suscripción iniciada desde OT ' || v_wo.folio,
    auth.uid()
  );
  
  RETURN v_subscription_id;
END;
$$;

-- 10. RLS Policies para wo_subscription_items
ALTER TABLE wo_subscription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: total acceso a wo_subscription_items"
ON wo_subscription_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operador: ve items de OTs de su branch"
ON wo_subscription_items
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'operador') 
  AND wo_id IN (
    SELECT id FROM work_orders 
    WHERE branch_id = get_user_branch(auth.uid())
  )
);

CREATE POLICY "Técnico: ve items de sus OTs"
ON wo_subscription_items
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'tecnico') 
  AND wo_id IN (
    SELECT id FROM work_orders 
    WHERE tecnico_id = auth.uid()
  )
);

-- Comentarios para documentación
COMMENT ON TABLE wo_subscription_items IS 'Items de órdenes de trabajo que requieren suscripción';
COMMENT ON FUNCTION convert_quote_to_wo_v2 IS 'Convierte una cotización aceptada en orden de trabajo con validaciones mejoradas';
COMMENT ON FUNCTION create_subscription_from_wo_item IS 'Crea una suscripción desde un item de OT completada';