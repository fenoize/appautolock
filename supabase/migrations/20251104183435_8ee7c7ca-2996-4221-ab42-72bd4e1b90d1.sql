
-- Temporalmente simplificar las políticas de SELECT en user_roles para debugging
-- Esto permitirá que cualquier usuario autenticado vea todos los roles

DROP POLICY IF EXISTS "Admin puede ver todos los roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuarios ven sus propios roles" ON public.user_roles;

-- Política simple: cualquier usuario autenticado puede leer user_roles
CREATE POLICY "Usuarios autenticados pueden ver roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Comentario: Esta es una política temporal para debugging.
-- Una vez identificado el problema, volveremos a políticas más restrictivas.
