-- Cambiar el campo estado de boolean a enum para soportar estados: activo, inactivo, invitado

-- Crear enum para estado de usuario
CREATE TYPE public.user_status AS ENUM ('activo', 'inactivo', 'invitado');

-- Guardar la definición de la vista y eliminarla temporalmente
DROP VIEW IF EXISTS public.seller_performance CASCADE;

-- Agregar nueva columna con el tipo enum
ALTER TABLE public.profiles 
ADD COLUMN estado_nuevo user_status DEFAULT 'activo';

-- Migrar datos existentes
UPDATE public.profiles 
SET estado_nuevo = CASE 
  WHEN estado = true THEN 'activo'::user_status
  ELSE 'inactivo'::user_status
END;

-- Hacer que la nueva columna sea NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN estado_nuevo SET NOT NULL;

-- Eliminar la columna antigua
ALTER TABLE public.profiles 
DROP COLUMN estado;

-- Renombrar la nueva columna
ALTER TABLE public.profiles 
RENAME COLUMN estado_nuevo TO estado;

-- Recrear la vista seller_performance con el estado correcto
CREATE OR REPLACE VIEW public.seller_performance AS
SELECT 
  p.id AS vendedor_id,
  p.nombre || ' ' || COALESCE(p.apellido, '') AS nombre_completo,
  p.email,
  p.branch_id,
  b.nombre AS branch_nombre,
  COUNT(DISTINCT c.id) AS total_clientes,
  COUNT(DISTINCT CASE 
    WHEN q.fecha_emision >= date_trunc('month', CURRENT_DATE) 
    THEN q.id 
  END) AS cotizaciones_mes_actual,
  COALESCE(SUM(CASE 
    WHEN q.estado = 'aceptada'::quote_status
    AND q.fecha_emision >= date_trunc('month', CURRENT_DATE)
    THEN q.total 
  END), 0) AS ventas_mes_actual,
  CASE 
    WHEN COUNT(DISTINCT CASE 
      WHEN q.fecha_emision >= date_trunc('month', CURRENT_DATE) 
      THEN q.id 
    END) > 0 
    THEN (COUNT(DISTINCT CASE 
      WHEN q.estado = 'aceptada'::quote_status
      AND q.fecha_emision >= date_trunc('month', CURRENT_DATE)
      THEN q.id 
    END)::numeric / COUNT(DISTINCT CASE 
      WHEN q.fecha_emision >= date_trunc('month', CURRENT_DATE) 
      THEN q.id 
    END)::numeric * 100)
    ELSE 0 
  END AS tasa_cierre_mes_actual,
  sg.meta_ventas,
  sg.meta_cotizaciones,
  sg.meta_cierre_porcentaje
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.branches b ON b.id = p.branch_id
LEFT JOIN public.clients c ON c.vendedor_id = p.id
LEFT JOIN public.quotes q ON q.vendedor_id = p.id
LEFT JOIN LATERAL (
  SELECT 
    meta_ventas,
    meta_cotizaciones,
    meta_cierre_porcentaje
  FROM public.seller_goals
  WHERE vendedor_id = p.id
  AND periodo = date_trunc('month', CURRENT_DATE)::date
  LIMIT 1
) sg ON true
WHERE ur.role = 'vendedor'::app_role
AND p.estado = 'activo'::user_status
GROUP BY 
  p.id, 
  p.nombre, 
  p.apellido, 
  p.email, 
  p.branch_id, 
  b.nombre,
  sg.meta_ventas,
  sg.meta_cotizaciones,
  sg.meta_cierre_porcentaje;