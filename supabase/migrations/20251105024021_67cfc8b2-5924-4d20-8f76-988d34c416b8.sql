-- 1. Eliminar el trigger y función viejos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.assign_first_admin();

-- 2. Crear nueva función que se ejecuta para TODOS los usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_branch_id UUID;
  v_is_first_admin BOOLEAN;
BEGIN
  -- Verificar si es el primer admin
  v_is_first_admin := NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
  
  -- Obtener la primera sucursal activa
  SELECT id INTO v_branch_id
  FROM public.branches
  WHERE activa = TRUE
  ORDER BY created_at
  LIMIT 1;
  
  -- Crear perfil para TODOS los usuarios
  INSERT INTO public.profiles (id, email, nombre, apellido, branch_id, estado)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    v_branch_id,
    'invitado'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(EXCLUDED.nombre, profiles.nombre),
    apellido = COALESCE(EXCLUDED.apellido, profiles.apellido);
  
  -- Solo asignar rol admin al primer usuario
  IF v_is_first_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Crear el trigger que se ejecuta para todos los usuarios
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Limpiar usuarios huérfanos (que existen en auth pero no en profiles)
INSERT INTO public.profiles (id, email, nombre, apellido, estado)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nombre', SPLIT_PART(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'apellido', ''),
  'invitado'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;