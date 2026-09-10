-- 1. Agregar valor 'expirada' al enum de estado de cotizaciones
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'expirada';

-- 2. Función que expira cotizaciones enviadas cuyo plazo de validez venció
CREATE OR REPLACE FUNCTION fn_auto_expire_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quotes
  SET estado = 'expirada'
  WHERE estado = 'enviada'
    AND (created_at::date + validez_dias) < CURRENT_DATE;
END;
$$;

-- 3. Programar ejecución diaria a la 1:00 AM (pg_cron ya está habilitado)
SELECT cron.schedule(
  'auto-expire-quotes',
  '0 1 * * *',
  'SELECT fn_auto_expire_quotes()'
);