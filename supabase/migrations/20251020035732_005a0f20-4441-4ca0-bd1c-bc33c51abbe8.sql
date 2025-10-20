-- Mejorar políticas RLS de user_roles para crear usuarios

-- Eliminar política existente
DROP POLICY IF EXISTS "Admin: total acceso a user_roles" ON public.user_roles;

-- Política separada para SELECT
CREATE POLICY "Admin puede ver todos los roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Política para INSERT permitiendo a admins crear roles para cualquier usuario
CREATE POLICY "Admin puede insertar roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Política para UPDATE
CREATE POLICY "Admin puede actualizar roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Política para DELETE
CREATE POLICY "Admin puede eliminar roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));