ALTER TABLE public.proveedores RENAME COLUMN nombre TO razon_social;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS nombre_fantasia text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS comuna text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS oficina text;