ALTER TABLE public.quotes
  ALTER COLUMN fecha_instalacion_propuesta TYPE TIMESTAMPTZ
  USING fecha_instalacion_propuesta::TIMESTAMPTZ;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS direccion_instalacion TEXT;

ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS direccion_instalacion TEXT;

CREATE OR REPLACE FUNCTION public.convert_quote_to_wo_v2(p_quote_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quote RECORD;
  v_wo_id UUID;
  v_item RECORD;
  v_sp RECORD;
  v_folio TEXT;
  v_stock_alerts JSONB := '[]'::JSONB;
  v_product RECORD;
  v_service RECORD;
  v_stock_actual NUMERIC;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotización no encontrada'; END IF;
  IF v_quote.estado != 'aceptada' THEN
    RAISE EXCEPTION 'Solo se pueden convertir cotizaciones aceptadas. Estado actual: %', v_quote.estado;
  END IF;
  IF v_quote.vehicle_id IS NULL THEN
    RAISE EXCEPTION 'La cotización debe tener un vehículo asignado antes de convertirse en OT';
  END IF;

  v_folio := generar_folio('OT');

  INSERT INTO work_orders (
    folio, client_id, vehicle_id, branch_id, quote_id,
    notas, estado, inventario_reservado, inventario_consumido, puede_editar, alertas_stock,
    fecha_programada, direccion_instalacion
  ) VALUES (
    v_folio, v_quote.client_id, v_quote.vehicle_id, v_quote.branch_id, p_quote_id,
    'Generada desde cotización ' || v_quote.folio,
    'pendiente', false, false, true, '[]'::jsonb,
    v_quote.fecha_instalacion_propuesta,
    v_quote.direccion_instalacion
  ) RETURNING id INTO v_wo_id;

  FOR v_item IN SELECT * FROM quote_items WHERE quote_id = p_quote_id LOOP
    INSERT INTO wo_items (wo_id, item_tipo, ref_id, nombre, cantidad, precio_unitario)
    VALUES (v_wo_id, v_item.item_tipo, v_item.ref_id, v_item.nombre, v_item.cantidad, v_item.precio_unitario);

    IF v_item.item_tipo = 'producto' AND v_item.ref_id IS NOT NULL THEN
      SELECT * INTO v_product FROM products WHERE id = v_item.ref_id;
      IF v_product.requiere_suscripcion THEN
        INSERT INTO wo_subscription_items (wo_id, item_tipo, ref_id, nombre, requiere_suscripcion)
        VALUES (v_wo_id, 'producto', v_item.ref_id, v_item.nombre, true);
      END IF;
      IF v_product.serializable THEN
        SELECT COALESCE(SUM(sbl.stock_actual), 0) INTO v_stock_actual
        FROM stock_by_location sbl
        JOIN stock_locations sl ON sl.id = sbl.location_id
        WHERE sbl.product_id = v_item.ref_id AND sl.activa = true;
        IF v_stock_actual < v_item.cantidad THEN
          v_stock_alerts := v_stock_alerts || jsonb_build_object(
            'producto_id', v_item.ref_id, 'nombre', v_item.nombre,
            'cantidad_requerida', v_item.cantidad, 'stock_disponible', v_stock_actual,
            'faltante', v_item.cantidad - v_stock_actual);
        END IF;
      END IF;
    END IF;

    IF v_item.item_tipo = 'servicio' AND v_item.ref_id IS NOT NULL THEN
      SELECT * INTO v_service FROM services WHERE id = v_item.ref_id;
      IF v_service.requiere_suscripcion THEN
        INSERT INTO wo_subscription_items (wo_id, item_tipo, ref_id, nombre, requiere_suscripcion)
        VALUES (v_wo_id, 'servicio', v_item.ref_id, v_item.nombre, true);
      END IF;
      FOR v_sp IN
        SELECT sp.product_id, sp.cantidad, p.nombre AS product_nombre,
               p.precio_venta, p.serializable
        FROM services_products sp
        JOIN products p ON p.id = sp.product_id
        WHERE sp.service_id = v_item.ref_id
      LOOP
        INSERT INTO wo_items (wo_id, item_tipo, ref_id, nombre, cantidad, precio_unitario)
        VALUES (v_wo_id, 'producto', v_sp.product_id, v_sp.product_nombre,
                COALESCE(v_sp.cantidad, 1), COALESCE(v_sp.precio_venta, 0));
        IF v_sp.serializable THEN
          SELECT COALESCE(SUM(sbl.stock_actual), 0) INTO v_stock_actual
          FROM stock_by_location sbl
          JOIN stock_locations sl ON sl.id = sbl.location_id
          WHERE sbl.product_id = v_sp.product_id AND sl.activa = true;
          IF v_stock_actual < COALESCE(v_sp.cantidad, 1) THEN
            v_stock_alerts := v_stock_alerts || jsonb_build_object(
              'producto_id', v_sp.product_id, 'nombre', v_sp.product_nombre,
              'cantidad_requerida', COALESCE(v_sp.cantidad, 1), 'stock_disponible', v_stock_actual,
              'faltante', COALESCE(v_sp.cantidad, 1) - v_stock_actual);
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  IF jsonb_array_length(v_stock_alerts) > 0 THEN
    UPDATE work_orders SET alertas_stock = v_stock_alerts WHERE id = v_wo_id;
  END IF;

  UPDATE quotes SET estado = 'convertida_ot', updated_at = now() WHERE id = p_quote_id;

  INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_nuevos)
  VALUES ('work_orders', v_wo_id, 'INSERT', auth.uid(),
          jsonb_build_object('origen', 'cotizacion', 'quote_id', p_quote_id));

  RETURN v_wo_id;
END;
$function$;