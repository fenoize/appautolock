-- Add GPS-specific fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS modelo_gps text,
ADD COLUMN IF NOT EXISTS imei_gps text,
ADD COLUMN IF NOT EXISTS imei_pcs text,
ADD COLUMN IF NOT EXISTS numero_pcs text,
ADD COLUMN IF NOT EXISTS compania text,
ADD COLUMN IF NOT EXISTS correo_usuario text,
ADD COLUMN IF NOT EXISTS app_alojada text,
ADD COLUMN IF NOT EXISTS instalador text;