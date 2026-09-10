ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS pre_check_completado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_check_data JSONB;