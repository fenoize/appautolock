-- Corregir search_path en generar_folio
CREATE OR REPLACE FUNCTION generar_folio(prefijo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anio_actual INTEGER := EXTRACT(YEAR FROM NOW());
  nueva_secuencia INTEGER;
  folio TEXT;
BEGIN
  INSERT INTO public.counters (clave, anio, secuencia)
  VALUES (prefijo, anio_actual, 1)
  ON CONFLICT (clave, anio) DO UPDATE
  SET secuencia = counters.secuencia + 1
  RETURNING secuencia INTO nueva_secuencia;
  
  folio := prefijo || '-' || anio_actual || '-' || LPAD(nueva_secuencia::TEXT, 4, '0');
  RETURN folio;
END;
$$;