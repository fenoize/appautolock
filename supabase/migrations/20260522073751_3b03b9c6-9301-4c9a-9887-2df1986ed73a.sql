-- 1. Add wo_id column to stock_moves linking to work orders
ALTER TABLE public.stock_moves
  ADD COLUMN IF NOT EXISTS wo_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_moves_wo_id ON public.stock_moves(wo_id);

-- 2. Update consumir_inventario_wo to populate wo_id
CREATE OR REPLACE FUNCTION public.consumir_inventario_wo(p_wo_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
  v_tecnico_location UUID;
  v_tecnico_id UUID;
BEGIN
  SELECT tecnico_id INTO v_tecnico_id FROM work_orders WHERE id = p_wo_id;

  SELECT id INTO v_tecnico_location
  FROM stock_locations
  WHERE tipo = 'camioneta' AND activa = true
  LIMIT 1;

  IF v_tecnico_location IS NULL THEN
    RAISE EXCEPTION 'No se encontró ubicación de camioneta';
  END IF;

  FOR v_item IN
    SELECT wi.ref_id as product_id, wi.cantidad
    FROM wo_items wi
    WHERE wi.wo_id = p_wo_id AND wi.item_tipo = 'producto' AND wi.ref_id IS NOT NULL
  LOOP
    INSERT INTO stock_moves (
      tipo, product_id, cantidad,
      from_location_id, referencia, user_id, wo_id
    )
    SELECT
      'consumo', v_item.product_id, v_item.cantidad,
      v_tecnico_location,
      'OT-' || wo.folio,
      v_tecnico_id,
      p_wo_id
    FROM work_orders wo WHERE wo.id = p_wo_id;
  END LOOP;

  UPDATE work_orders SET inventario_consumido = TRUE WHERE id = p_wo_id;
END;
$function$;

-- 3. Update reservar_inventario_wo to populate wo_id too
CREATE OR REPLACE FUNCTION public.reservar_inventario_wo(p_wo_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
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

  FOR v_item IN
    SELECT wi.ref_id as product_id, wi.cantidad
    FROM wo_items wi
    WHERE wi.wo_id = p_wo_id AND wi.item_tipo = 'producto' AND wi.ref_id IS NOT NULL
  LOOP
    INSERT INTO stock_moves (
      tipo, product_id, cantidad,
      from_location_id, to_location_id,
      referencia, user_id, wo_id
    )
    SELECT
      'reserva', v_item.product_id, v_item.cantidad,
      v_bodega_location,
      v_tecnico_location,
      'OT-' || wo.folio,
      v_tecnico_id,
      p_wo_id
    FROM work_orders wo WHERE wo.id = p_wo_id;
  END LOOP;

  UPDATE work_orders SET inventario_reservado = TRUE WHERE id = p_wo_id;
END;
$function$;