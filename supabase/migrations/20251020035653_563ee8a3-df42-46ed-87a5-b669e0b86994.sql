-- Corregir políticas RLS para user_roles para permitir a admins crear roles

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admin: total acceso a user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuarios ven sus propios roles" ON public.user_roles;

-- Política para que admins puedan hacer todo
CREATE POLICY "Admin: total acceso a user_roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Política para que usuarios vean sus propios roles
CREATE POLICY "Usuarios ven sus propios roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);