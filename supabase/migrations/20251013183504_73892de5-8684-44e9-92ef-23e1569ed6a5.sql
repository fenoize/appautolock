-- Agregar nuevos estados al enum quote_status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'quote_status' AND e.enumlabel = 'convertida_ot') THEN
    ALTER TYPE quote_status ADD VALUE 'convertida_ot';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'quote_status' AND e.enumlabel = 'cancelada') THEN
    ALTER TYPE quote_status ADD VALUE 'cancelada';
  END IF;
END $$;

-- Agregar columna vehicle_id a quotes (nullable)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

-- Índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id ON quotes(vehicle_id);

-- Función para verificar compatibilidad de items (placeholder)
CREATE OR REPLACE FUNCTION verificar_compatibilidad_items(
  p_vehicle_id UUID,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_incompatibilidades JSONB := '[]'::JSONB;
BEGIN
  -- Por ahora retorna array vacío
  -- Se puede expandir en futuro con lógica de compatibilidad
  RETURN v_incompatibilidades;
END;
$$ LANGUAGE plpgsql;

-- Función para convertir cotización a orden de trabajo
CREATE OR REPLACE FUNCTION convert_quote_to_wo(p_quote_id UUID)
RETURNS UUID AS $$
DECLARE
  v_quote RECORD;
  v_wo_id UUID;
  v_item RECORD;
  v_folio TEXT;
BEGIN
  -- Validar estado
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotización no encontrada';
  END IF;
  
  IF v_quote.estado != 'aceptada' THEN
    RAISE EXCEPTION 'Solo se pueden convertir cotizaciones aceptadas';
  END IF;
  
  -- Generar folio para la OT
  v_folio := generar_folio('OT');
  
  -- Crear OT
  INSERT INTO work_orders (
    folio,
    client_id,
    vehicle_id,
    branch_id,
    quote_id,
    notas,
    estado,
    inventario_reservado,
    inventario_consumido
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
    false
  )
  RETURNING id INTO v_wo_id;
  
  -- Copiar items de cotización a OT
  FOR v_item IN 
    SELECT * FROM quote_items WHERE quote_id = p_quote_id
  LOOP
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
  END LOOP;
  
  -- Actualizar estado de cotización
  UPDATE quotes
  SET estado = 'convertida_ot',
      updated_at = now()
  WHERE id = p_quote_id;
  
  RETURN v_wo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;