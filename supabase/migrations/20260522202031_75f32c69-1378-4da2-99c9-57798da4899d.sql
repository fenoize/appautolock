
CREATE TABLE IF NOT EXISTS public.product_compatibility_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  product_id uuid NOT NULL,
  vehicle_catalog_id uuid NOT NULL,
  estado_anterior text,
  observaciones_anteriores text,
  estado_nuevo text,
  observaciones_nuevas text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reverted boolean NOT NULL DEFAULT false,
  revert_of_batch_id uuid
);

CREATE INDEX IF NOT EXISTS idx_pch_product ON public.product_compatibility_history (product_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pch_batch ON public.product_compatibility_history (batch_id);

ALTER TABLE public.product_compatibility_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados ven historial de compatibilidad"
ON public.product_compatibility_history
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona historial de compatibilidad"
ON public.product_compatibility_history
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Autenticados crean historial de compatibilidad"
ON public.product_compatibility_history
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND changed_by = auth.uid());
