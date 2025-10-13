-- Corregir search_path en función calcular_duracion_wo
CREATE OR REPLACE FUNCTION calcular_duracion_wo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fecha_fin_real IS NOT NULL AND NEW.fecha_inicio_real IS NOT NULL THEN
    NEW.duracion_minutos := EXTRACT(EPOCH FROM (NEW.fecha_fin_real - NEW.fecha_inicio_real)) / 60;
  END IF;
  RETURN NEW;
END;
$$;