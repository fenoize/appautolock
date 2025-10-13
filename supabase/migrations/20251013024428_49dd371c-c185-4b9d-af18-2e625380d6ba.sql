-- Tabla: seller_goals (Metas mensuales de vendedores)
CREATE TABLE seller_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  periodo DATE NOT NULL,
  meta_cotizaciones INTEGER NOT NULL,
  meta_ventas NUMERIC NOT NULL,
  meta_cierre_porcentaje NUMERIC DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendedor_id, periodo)
);

CREATE INDEX idx_seller_goals_vendedor ON seller_goals(vendedor_id);
CREATE INDEX idx_seller_goals_periodo ON seller_goals(periodo);

ALTER TABLE seller_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: gestiona metas de vendedores"
ON seller_goals FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedor: ve sus propias metas"
ON seller_goals FOR SELECT
USING (has_role(auth.uid(), 'vendedor') AND vendedor_id = auth.uid());

CREATE TRIGGER trigger_update_seller_goals_updated_at
BEFORE UPDATE ON seller_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla: commission_config (Configuración de comisiones - parametrizable)
CREATE TABLE commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  config JSONB NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  vigencia_desde DATE NOT NULL,
  vigencia_hasta DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commission_config_vendedor ON commission_config(vendedor_id);
CREATE INDEX idx_commission_config_activa ON commission_config(activa) WHERE activa = TRUE;

ALTER TABLE commission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: gestiona comisiones"
ON commission_config FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedor: ve su configuración de comisiones"
ON commission_config FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor') AND 
  (vendedor_id = auth.uid() OR vendedor_id IS NULL)
);

CREATE TRIGGER trigger_update_commission_config_updated_at
BEFORE UPDATE ON commission_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función: calcular_metricas_vendedor
CREATE OR REPLACE FUNCTION calcular_metricas_vendedor(
  p_vendedor_id UUID,
  p_fecha_desde DATE,
  p_fecha_hasta DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_cotizaciones INTEGER;
  v_cotizaciones_enviadas INTEGER;
  v_cotizaciones_aceptadas INTEGER;
  v_cotizaciones_rechazadas INTEGER;
  v_tasa_cierre NUMERIC;
  v_ventas_totales NUMERIC;
  v_ticket_promedio NUMERIC;
  v_clientes_activos INTEGER;
  v_clientes_nuevos INTEGER;
  v_oportunidades_activas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_cotizaciones
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta;
  
  SELECT COUNT(*) INTO v_cotizaciones_enviadas
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND estado != 'borrador';
  
  SELECT COUNT(*) INTO v_cotizaciones_aceptadas
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND estado = 'aceptada';
  
  SELECT COUNT(*) INTO v_cotizaciones_rechazadas
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND estado = 'rechazada';
  
  v_tasa_cierre := CASE 
    WHEN v_cotizaciones_enviadas > 0 THEN 
      (v_cotizaciones_aceptadas::NUMERIC / v_cotizaciones_enviadas::NUMERIC) * 100
    ELSE 0
  END;
  
  SELECT COALESCE(SUM(total), 0) INTO v_ventas_totales
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND estado = 'aceptada';
  
  v_ticket_promedio := CASE 
    WHEN v_cotizaciones_aceptadas > 0 THEN v_ventas_totales / v_cotizaciones_aceptadas
    ELSE 0
  END;
  
  SELECT COUNT(DISTINCT client_id) INTO v_clientes_activos
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND estado = 'aceptada';
  
  SELECT COUNT(*) INTO v_clientes_nuevos
  FROM clients
  WHERE vendedor_id = p_vendedor_id
    AND created_at::DATE BETWEEN p_fecha_desde AND p_fecha_hasta;
  
  SELECT COUNT(*) INTO v_oportunidades_activas
  FROM quotes
  WHERE vendedor_id = p_vendedor_id
    AND estado = 'enviada';
  
  v_result := jsonb_build_object(
    'total_cotizaciones', v_total_cotizaciones,
    'cotizaciones_enviadas', v_cotizaciones_enviadas,
    'cotizaciones_aceptadas', v_cotizaciones_aceptadas,
    'cotizaciones_rechazadas', v_cotizaciones_rechazadas,
    'tasa_cierre', ROUND(v_tasa_cierre, 2),
    'ventas_totales', v_ventas_totales,
    'ticket_promedio', ROUND(v_ticket_promedio, 0),
    'clientes_activos', v_clientes_activos,
    'clientes_nuevos', v_clientes_nuevos,
    'oportunidades_activas', v_oportunidades_activas
  );
  
  RETURN v_result;
END;
$$;

-- Función: obtener_ranking_vendedores
CREATE OR REPLACE FUNCTION obtener_ranking_vendedores(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  vendedor_id UUID,
  nombre_completo TEXT,
  branch_nombre TEXT,
  total_ventas NUMERIC,
  total_cotizaciones INTEGER,
  tasa_cierre NUMERIC,
  ranking INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ventas_por_vendedor AS (
    SELECT 
      q.vendedor_id,
      COUNT(*) as total_cotizaciones,
      COUNT(CASE WHEN q.estado = 'aceptada' THEN 1 END) as cotizaciones_aceptadas,
      COALESCE(SUM(CASE WHEN q.estado = 'aceptada' THEN q.total ELSE 0 END), 0) as total_ventas
    FROM quotes q
    WHERE q.fecha_emision::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
      AND (p_branch_id IS NULL OR q.branch_id = p_branch_id)
    GROUP BY q.vendedor_id
  )
  SELECT 
    v.vendedor_id,
    CONCAT(p.nombre, ' ', COALESCE(p.apellido, '')) as nombre_completo,
    b.nombre as branch_nombre,
    v.total_ventas,
    v.total_cotizaciones::INTEGER,
    CASE 
      WHEN v.total_cotizaciones > 0 THEN 
        ROUND((v.cotizaciones_aceptadas::NUMERIC / v.total_cotizaciones::NUMERIC) * 100, 2)
      ELSE 0
    END as tasa_cierre,
    RANK() OVER (ORDER BY v.total_ventas DESC)::INTEGER as ranking
  FROM ventas_por_vendedor v
  JOIN profiles p ON p.id = v.vendedor_id
  LEFT JOIN branches b ON b.id = p.branch_id
  ORDER BY v.total_ventas DESC;
END;
$$;

-- Función: asignar_clientes_vendedor
CREATE OR REPLACE FUNCTION asignar_clientes_vendedor(
  p_client_ids UUID[],
  p_vendedor_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF NOT has_role(p_vendedor_id, 'vendedor') THEN
    RAISE EXCEPTION 'El usuario no tiene rol de vendedor';
  END IF;
  
  UPDATE clients
  SET vendedor_id = p_vendedor_id
  WHERE id = ANY(p_client_ids);
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated;
END;
$$;

-- Vista: seller_performance
CREATE VIEW seller_performance AS
SELECT 
  p.id as vendedor_id,
  CONCAT(p.nombre, ' ', COALESCE(p.apellido, '')) as nombre_completo,
  p.email,
  p.branch_id,
  b.nombre as branch_nombre,
  
  (SELECT COUNT(*) FROM clients WHERE vendedor_id = p.id) as total_clientes,
  
  (SELECT COUNT(*) FROM quotes WHERE vendedor_id = p.id AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW())) as cotizaciones_mes_actual,
  
  (SELECT COALESCE(SUM(total), 0) FROM quotes WHERE vendedor_id = p.id AND estado = 'aceptada' AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW())) as ventas_mes_actual,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM quotes WHERE vendedor_id = p.id AND estado != 'borrador' AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW())) > 0 THEN
      ROUND(
        ((SELECT COUNT(*) FROM quotes WHERE vendedor_id = p.id AND estado = 'aceptada' AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW()))::NUMERIC /
        (SELECT COUNT(*) FROM quotes WHERE vendedor_id = p.id AND estado != 'borrador' AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW()))::NUMERIC) * 100,
        2
      )
    ELSE 0
  END as tasa_cierre_mes_actual,
  
  sg.meta_cotizaciones,
  sg.meta_ventas,
  sg.meta_cierre_porcentaje
  
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'vendedor'
LEFT JOIN branches b ON b.id = p.branch_id
LEFT JOIN seller_goals sg ON sg.vendedor_id = p.id AND sg.periodo = DATE_TRUNC('month', NOW())::DATE
WHERE p.estado = TRUE;