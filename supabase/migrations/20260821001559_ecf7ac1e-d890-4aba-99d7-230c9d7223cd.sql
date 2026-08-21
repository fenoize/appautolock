ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS revision_data jsonb,
  ADD COLUMN IF NOT EXISTS confirmacion_data jsonb;

ALTER TABLE public.wo_items
  ADD COLUMN IF NOT EXISTS serial_instalado text,
  ADD COLUMN IF NOT EXISTS serial_verificado boolean DEFAULT false;