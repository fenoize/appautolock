-- Corregir typo: "Susuki" → "Suzuki" en vehicle_catalog
UPDATE public.vehicle_catalog
SET marca = 'Suzuki'
WHERE marca = 'Susuki';