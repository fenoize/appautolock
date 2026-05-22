ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS email_enviado_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS email_destinatario TEXT;