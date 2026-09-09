-- Tabla de registro de renovaciones de suscripciones GPS
CREATE TABLE IF NOT EXISTS public.subscription_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  renewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_anterior DATE NOT NULL,
  fecha_nueva DATE NOT NULL,
  renovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.subscription_renewals TO authenticated;
GRANT ALL ON public.subscription_renewals TO service_role;

CREATE INDEX IF NOT EXISTS idx_subscription_renewals_subscription_id
  ON public.subscription_renewals(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_renewals_renewed_at
  ON public.subscription_renewals(renewed_at DESC);

ALTER TABLE public.subscription_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view renewals"
  ON public.subscription_renewals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert renewals"
  ON public.subscription_renewals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Función que detecta y registra renovaciones automáticamente
CREATE OR REPLACE FUNCTION public.fn_log_subscription_renewal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo registrar si fecha_vencimiento aumentó (es una renovación real, no corrección)
  IF NEW.fecha_vencimiento > OLD.fecha_vencimiento THEN
    INSERT INTO public.subscription_renewals (
      subscription_id,
      renewed_at,
      fecha_anterior,
      fecha_nueva,
      renovado_por
    ) VALUES (
      NEW.id,
      NOW(),
      OLD.fecha_vencimiento,
      NEW.fecha_vencimiento,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger sobre subscriptions
DROP TRIGGER IF EXISTS trg_log_subscription_renewal ON public.subscriptions;

CREATE TRIGGER trg_log_subscription_renewal
  AFTER UPDATE OF fecha_vencimiento ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_log_subscription_renewal();