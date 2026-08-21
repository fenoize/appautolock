ALTER TABLE public.product_serials DROP CONSTRAINT IF EXISTS product_serials_estado_check;
ALTER TABLE public.product_serials ADD CONSTRAINT product_serials_estado_check
  CHECK (estado IN ('disponible','reservado','vendido','defectuoso','sin_serial'));