ALTER TABLE public.work_orders
ADD COLUMN IF NOT EXISTS evidencias_pre_urls  text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS evidencias_post_urls text[] DEFAULT '{}';