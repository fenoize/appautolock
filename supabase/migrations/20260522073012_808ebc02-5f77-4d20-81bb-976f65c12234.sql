ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS inventario_consumido_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.trigger_consumir_inventario_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'completada' AND OLD.estado IS DISTINCT FROM 'completada' AND NOT COALESCE(NEW.inventario_consumido, false) THEN
    BEGIN
      PERFORM public.consumir_inventario_wo(NEW.id);
      UPDATE public.work_orders
      SET inventario_consumido = true,
          inventario_consumido_at = NOW()
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error al consumir inventario para OT %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wo_completada_consumir_inventario ON public.work_orders;
CREATE TRIGGER on_wo_completada_consumir_inventario
AFTER UPDATE OF estado ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_consumir_inventario_on_complete();