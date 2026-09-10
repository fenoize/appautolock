ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pendiente_activacion';

CREATE OR REPLACE FUNCTION fn_activate_subscriptions_on_wo_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'completada' AND OLD.estado <> 'completada' THEN
    UPDATE public.subscriptions
    SET estado = 'activa'
    WHERE wo_id = NEW.id
      AND estado = 'pendiente_activacion';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activate_subscriptions_on_wo_complete ON public.work_orders;

CREATE TRIGGER trg_activate_subscriptions_on_wo_complete
  AFTER UPDATE OF estado ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_activate_subscriptions_on_wo_complete();