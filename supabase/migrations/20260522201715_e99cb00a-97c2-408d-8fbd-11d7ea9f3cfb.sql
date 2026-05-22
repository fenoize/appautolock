
DO $$
DECLARE
  r record;
  y int;
  new_id uuid;
BEGIN
  FOR r IN
    SELECT * FROM public.vehicle_catalog
    WHERE anio_desde IS NOT NULL AND anio_hasta IS NOT NULL AND anio_hasta > anio_desde
  LOOP
    FOR y IN r.anio_desde..r.anio_hasta LOOP
      -- Evitar duplicar si ya existe una fila individual para ese año/combinación
      IF NOT EXISTS (
        SELECT 1 FROM public.vehicle_catalog
        WHERE marca = r.marca
          AND modelo = r.modelo
          AND anio_desde = y AND anio_hasta = y
          AND COALESCE(tipo_combustible,'') = COALESCE(r.tipo_combustible,'')
          AND COALESCE(tipo_encendido,'') = COALESCE(r.tipo_encendido,'')
      ) THEN
        INSERT INTO public.vehicle_catalog (marca, modelo, anio_desde, anio_hasta, tipo_combustible, tipo_encendido)
        VALUES (r.marca, r.modelo, y, y, r.tipo_combustible, r.tipo_encendido)
        RETURNING id INTO new_id;

        -- Copiar compatibilidades del registro original al año nuevo
        INSERT INTO public.product_compatibility (product_id, vehicle_catalog_id, estado, observaciones, updated_by, updated_at)
        SELECT product_id, new_id, estado, observaciones, updated_by, updated_at
        FROM public.product_compatibility
        WHERE vehicle_catalog_id = r.id
        ON CONFLICT (product_id, vehicle_catalog_id) DO NOTHING;
      END IF;
    END LOOP;

    -- Eliminar compatibilidades y la fila original con rango
    DELETE FROM public.product_compatibility WHERE vehicle_catalog_id = r.id;
    DELETE FROM public.vehicle_catalog WHERE id = r.id;
  END LOOP;
END $$;
