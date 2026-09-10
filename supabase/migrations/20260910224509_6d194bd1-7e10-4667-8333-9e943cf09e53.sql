-- vehicle_catalog es de solo lectura para el frontend: cualquier usuario autenticado puede leerla
CREATE POLICY "Authenticated users can read vehicle_catalog"
ON public.vehicle_catalog
FOR SELECT
TO authenticated
USING (true);

-- product_compatibility también — verificar si tiene el mismo problema
CREATE POLICY "Authenticated users can read product_compatibility"
ON public.product_compatibility
FOR SELECT
TO authenticated
USING (true);