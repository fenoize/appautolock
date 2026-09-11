ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS default_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.activate_wo_subscriptions(p_wo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wo      RECORD;
  v_item    RECORD;
  v_plan    RECORD;
  v_sub_id  UUID;
  v_folio   TEXT;
BEGIN
  SELECT * INTO v_wo FROM work_orders WHERE id = p_wo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'OT no encontrada: %', p_wo_id; END IF;

  FOR v_item IN
    SELECT * FROM wo_items
    WHERE wo_id = p_wo_id AND item_tipo = 'suscripcion' AND ref_id IS NOT NULL
  LOOP
    SELECT * INTO v_plan FROM subscription_plans WHERE id = v_item.ref_id AND activo = true;
    IF NOT FOUND THEN CONTINUE; END IF;

    IF EXISTS (SELECT 1 FROM subscriptions WHERE wo_id = p_wo_id AND plan_id = v_plan.id) THEN
      CONTINUE;
    END IF;

    v_folio := generar_folio('SUB');

    INSERT INTO subscriptions (
      folio, client_id, vehicle_id, plan_id,
      estado, fecha_inicio, fecha_vencimiento, wo_id, notas
    ) VALUES (
      v_folio, v_wo.client_id, v_wo.vehicle_id, v_plan.id,
      'activa',
      CURRENT_DATE,
      (CURRENT_DATE + (v_plan.periodo_meses || ' months')::interval)::date,
      p_wo_id,
      'Creada automáticamente al completar OT ' || v_wo.folio
    ) RETURNING id INTO v_sub_id;

    UPDATE wo_subscription_items
    SET subscription_id = v_sub_id
    WHERE wo_id = p_wo_id AND ref_id = v_plan.id;

  END LOOP;
END;
$function$;