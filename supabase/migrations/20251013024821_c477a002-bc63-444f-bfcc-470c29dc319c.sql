-- =====================================================
-- FASE 7: Dashboard con KPIs - Funciones de Análisis
-- =====================================================

-- Función: Top Productos/Servicios más vendidos
CREATE OR REPLACE FUNCTION obtener_top_productos_servicios(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_branch_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  item_tipo TEXT,
  ref_id UUID,
  nombre TEXT,
  cantidad_total NUMERIC,
  ventas_totales NUMERIC,
  veces_vendido BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH items_cotizaciones AS (
    SELECT 
      qi.item_tipo,
      qi.ref_id,
      qi.nombre,
      SUM(qi.cantidad) as cantidad_total,
      SUM(qi.subtotal) as ventas_totales,
      COUNT(DISTINCT qi.quote_id) as veces_vendido
    FROM quote_items qi
    JOIN quotes q ON q.id = qi.quote_id
    WHERE q.estado = 'aceptada'
      AND q.fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
      AND (p_branch_id IS NULL OR q.branch_id = p_branch_id)
    GROUP BY qi.item_tipo, qi.ref_id, qi.nombre
  )
  SELECT 
    ic.item_tipo,
    ic.ref_id,
    ic.nombre,
    ic.cantidad_total,
    ic.ventas_totales,
    ic.veces_vendido
  FROM items_cotizaciones ic
  ORDER BY ic.ventas_totales DESC
  LIMIT p_limit;
END;
$$;

-- Función: Calcular rotación de inventario
CREATE OR REPLACE FUNCTION calcular_rotacion_inventario(
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS TABLE (
  product_id UUID,
  sku TEXT,
  nombre TEXT,
  stock_promedio NUMERIC,
  consumos NUMERIC,
  rotacion NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH consumos AS (
    SELECT 
      sm.product_id,
      SUM(sm.cantidad) as total_consumido
    FROM stock_moves sm
    WHERE sm.tipo = 'consumo'
      AND sm.fecha::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    GROUP BY sm.product_id
  ),
  stock_promedio AS (
    SELECT 
      sbl.product_id,
      AVG(sbl.stock_actual) as promedio
    FROM stock_by_location sbl
    GROUP BY sbl.product_id
  )
  SELECT 
    p.id,
    p.sku,
    p.nombre,
    COALESCE(sp.promedio, 0) as stock_promedio,
    COALESCE(c.total_consumido, 0) as consumos,
    CASE 
      WHEN COALESCE(sp.promedio, 0) > 0 THEN 
        COALESCE(c.total_consumido, 0) / sp.promedio
      ELSE 0
    END as rotacion
  FROM products p
  LEFT JOIN consumos c ON c.product_id = p.id
  LEFT JOIN stock_promedio sp ON sp.product_id = p.id
  WHERE p.activo = TRUE
  ORDER BY rotacion DESC;
END;
$$;

-- Función: Productividad de técnicos
CREATE OR REPLACE FUNCTION calcular_productividad_tecnicos(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tecnico_id UUID,
  nombre_completo TEXT,
  branch_nombre TEXT,
  ots_completadas INTEGER,
  ots_totales INTEGER,
  tiempo_promedio_minutos NUMERIC,
  eficiencia NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH tecnico_stats AS (
    SELECT 
      wo.tecnico_id,
      COUNT(*) as total_ots,
      COUNT(CASE WHEN wo.estado = 'completada' THEN 1 END) as ots_completadas,
      AVG(CASE WHEN wo.duracion_minutos IS NOT NULL THEN wo.duracion_minutos END) as tiempo_promedio
    FROM work_orders wo
    WHERE wo.tecnico_id IS NOT NULL
      AND wo.fecha_programada::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
      AND (p_branch_id IS NULL OR wo.branch_id = p_branch_id)
    GROUP BY wo.tecnico_id
  )
  SELECT 
    ts.tecnico_id,
    CONCAT(p.nombre, ' ', COALESCE(p.apellido, '')) as nombre_completo,
    b.nombre as branch_nombre,
    ts.ots_completadas::INTEGER,
    ts.total_ots::INTEGER,
    COALESCE(ROUND(ts.tiempo_promedio, 0), 0) as tiempo_promedio_minutos,
    CASE 
      WHEN ts.total_ots > 0 THEN 
        ROUND((ts.ots_completadas::NUMERIC / ts.total_ots::NUMERIC) * 100, 2)
      ELSE 0
    END as eficiencia
  FROM tecnico_stats ts
  JOIN profiles p ON p.id = ts.tecnico_id
  LEFT JOIN branches b ON b.id = p.branch_id
  ORDER BY ts.ots_completadas DESC;
END;
$$;