-- Función para asignar rol admin automáticamente al primer usuario
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Solo asignar admin si no existe ningún usuario con ese rol
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    
    -- Obtener la primera sucursal activa
    SELECT id INTO v_branch_id
    FROM public.branches
    WHERE activa = TRUE
    ORDER BY created_at
    LIMIT 1;
    
    -- Crear perfil en public.profiles
    INSERT INTO public.profiles (id, email, nombre, apellido, branch_id, estado)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'apellido', 'Admin'),
      v_branch_id,
      TRUE
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Asignar rol admin en user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta cuando un nuevo usuario se registra en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_first_admin();