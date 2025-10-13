-- ============================================
-- FASE 5: INVENTARIO CON KARDEX MULTI-UBICACIÓN
-- ============================================

-- 1. TABLA product_serials (IMEI/números de serie)
CREATE TABLE product_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL UNIQUE,
  location_id UUID REFERENCES stock_locations(id),
  estado TEXT DEFAULT 'disponible',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_serials_product ON product_serials(product_id);
CREATE INDEX idx_product_serials_location ON product_serials(location_id);
CREATE INDEX idx_product_serials_serial ON product_serials(serial_number);

ALTER TABLE product_serials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trigger_update_product_serials_updated_at
BEFORE UPDATE ON product_serials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. VISTA MATERIALIZADA stock_by_location
CREATE MATERIALIZED VIEW stock_by_location AS
SELECT 
  p.id as product_id,
  p.sku,
  p.nombre,
  p.stock_minimo,
  sl.id as location_id,
  sl.nombre as location_nombre,
  sl.tipo as location_tipo,
  sl.branch_id,
  COALESCE(
    SUM(CASE 
      WHEN sm.to_location_id = sl.id THEN sm.cantidad
      WHEN sm.from_location_id = sl.id THEN -sm.cantidad
      ELSE 0
    END), 0
  ) as stock_actual,
  COUNT(CASE WHEN sm.tipo = 'reserva' AND sm.to_location_id = sl.id THEN 1 END) as reservas_activas
FROM products p
CROSS JOIN stock_locations sl
LEFT JOIN stock_moves sm ON 
  sm.product_id = p.id AND 
  (sm.from_location_id = sl.id OR sm.to_location_id = sl.id)
WHERE p.activo = TRUE AND sl.activa = TRUE
GROUP BY p.id, p.sku, p.nombre, p.stock_minimo, sl.id, sl.nombre, sl.tipo, sl.branch_id;

CREATE UNIQUE INDEX idx_stock_by_location_unique ON stock_by_location(product_id, location_id);
CREATE INDEX idx_stock_by_location_product ON stock_by_location(product_id);
CREATE INDEX idx_stock_by_location_location ON stock_by_location(location_id);
CREATE INDEX idx_stock_by_location_branch ON stock_by_location(branch_id);


-- 3. TABLA stock_alerts
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES stock_locations(id),
  tipo TEXT NOT NULL,
  stock_actual NUMERIC NOT NULL,
  stock_minimo NUMERIC NOT NULL,
  resuelta BOOLEAN DEFAULT FALSE,
  resuelta_at TIMESTAMPTZ,
  resuelta_por UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_location ON stock_alerts(location_id);
CREATE INDEX idx_stock_alerts_resuelta ON stock_alerts(resuelta) WHERE resuelta = FALSE;

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;


-- 4. FUNCIÓN: refresh_stock_by_location()
CREATE OR REPLACE FUNCTION refresh_stock_by_location()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY stock_by_location;
END;
$$;


-- 5. FUNCIÓN: calcular_stock_producto()
CREATE OR REPLACE FUNCTION calcular_stock_producto(
  p_product_id UUID,
  p_location_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock NUMERIC;
BEGIN
  SELECT COALESCE(
    SUM(CASE 
      WHEN to_location_id = p_location_id THEN cantidad
      WHEN from_location_id = p_location_id THEN -cantidad
      ELSE 0
    END), 0
  )
  INTO v_stock
  FROM stock_moves
  WHERE product_id = p_product_id
    AND (from_location_id = p_location_id OR to_location_id = p_location_id);
  
  RETURN v_stock;
END;
$$;


-- 6. FUNCIÓN: verificar_alertas_stock()
CREATE OR REPLACE FUNCTION verificar_alertas_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  UPDATE stock_alerts sa
  SET resuelta = TRUE, resuelta_at = NOW()
  WHERE resuelta = FALSE
    AND EXISTS (
      SELECT 1 FROM stock_by_location sbl
      WHERE sbl.product_id = sa.product_id
        AND sbl.location_id = sa.location_id
        AND sbl.stock_actual >= sa.stock_minimo
    );
  
  FOR v_record IN 
    SELECT 
      sbl.product_id,
      sbl.location_id,
      sbl.stock_actual,
      sbl.stock_minimo
    FROM stock_by_location sbl
    WHERE sbl.stock_actual < sbl.stock_minimo
      AND NOT EXISTS (
        SELECT 1 FROM stock_alerts sa
        WHERE sa.product_id = sbl.product_id
          AND sa.location_id = sbl.location_id
          AND sa.resuelta = FALSE
      )
  LOOP
    INSERT INTO stock_alerts (
      product_id, location_id, tipo, stock_actual, stock_minimo
    )
    VALUES (
      v_record.product_id,
      v_record.location_id,
      CASE WHEN v_record.stock_actual <= 0 THEN 'sin_stock' ELSE 'stock_minimo' END,
      v_record.stock_actual,
      v_record.stock_minimo
    );
  END LOOP;
END;
$$;


-- 7. FUNCIÓN: registrar_compra_stock()
CREATE OR REPLACE FUNCTION registrar_compra_stock(
  p_product_id UUID,
  p_location_id UUID,
  p_cantidad NUMERIC,
  p_precio_costo NUMERIC,
  p_referencia TEXT,
  p_notas TEXT DEFAULT NULL,
  p_serials TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_move_id UUID;
  v_serial TEXT;
  v_is_serializable BOOLEAN;
BEGIN
  SELECT serializable INTO v_is_serializable
  FROM products WHERE id = p_product_id;
  
  IF v_is_serializable AND (p_serials IS NULL OR array_length(p_serials, 1) != p_cantidad) THEN
    RAISE EXCEPTION 'Producto serializable: debe proporcionar % números de serie', p_cantidad;
  END IF;
  
  INSERT INTO stock_moves (
    tipo, product_id, cantidad, to_location_id, referencia, notas, user_id
  )
  VALUES (
    'compra', p_product_id, p_cantidad, p_location_id, p_referencia, p_notas, auth.uid()
  )
  RETURNING id INTO v_move_id;
  
  UPDATE products
  SET precio_costo = p_precio_costo
  WHERE id = p_product_id AND (precio_costo IS NULL OR precio_costo != p_precio_costo);
  
  IF v_is_serializable THEN
    FOREACH v_serial IN ARRAY p_serials
    LOOP
      INSERT INTO product_serials (product_id, serial_number, location_id, estado)
      VALUES (p_product_id, v_serial, p_location_id, 'disponible');
    END LOOP;
  END IF;
  
  RETURN v_move_id;
END;
$$;


-- 8. FUNCIÓN: trasladar_stock()
CREATE OR REPLACE FUNCTION trasladar_stock(
  p_product_id UUID,
  p_from_location_id UUID,
  p_to_location_id UUID,
  p_cantidad NUMERIC,
  p_notas TEXT DEFAULT NULL,
  p_serials TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_move_id UUID;
  v_stock_origen NUMERIC;
  v_serial TEXT;
  v_is_serializable BOOLEAN;
BEGIN
  v_stock_origen := calcular_stock_producto(p_product_id, p_from_location_id);
  
  IF v_stock_origen < p_cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente en origen. Disponible: %, Solicitado: %', v_stock_origen, p_cantidad;
  END IF;
  
  SELECT serializable INTO v_is_serializable
  FROM products WHERE id = p_product_id;
  
  IF v_is_serializable AND (p_serials IS NULL OR array_length(p_serials, 1) != p_cantidad) THEN
    RAISE EXCEPTION 'Producto serializable: debe especificar % números de serie', p_cantidad;
  END IF;
  
  INSERT INTO stock_moves (
    tipo, product_id, cantidad, from_location_id, to_location_id, notas, user_id
  )
  VALUES (
    'traslado', p_product_id, p_cantidad, p_from_location_id, p_to_location_id, p_notas, auth.uid()
  )
  RETURNING id INTO v_move_id;
  
  IF v_is_serializable THEN
    FOREACH v_serial IN ARRAY p_serials
    LOOP
      UPDATE product_serials
      SET location_id = p_to_location_id
      WHERE product_id = p_product_id
        AND serial_number = v_serial
        AND location_id = p_from_location_id;
    END LOOP;
  END IF;
  
  RETURN v_move_id;
END;
$$;


-- 9. FUNCIÓN: ajustar_stock()
CREATE OR REPLACE FUNCTION ajustar_stock(
  p_product_id UUID,
  p_location_id UUID,
  p_cantidad_nueva NUMERIC,
  p_razon TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_move_id UUID;
  v_stock_actual NUMERIC;
  v_diferencia NUMERIC;
BEGIN
  v_stock_actual := calcular_stock_producto(p_product_id, p_location_id);
  v_diferencia := p_cantidad_nueva - v_stock_actual;
  
  IF v_diferencia = 0 THEN
    RAISE EXCEPTION 'No hay diferencia entre stock actual y nuevo';
  END IF;
  
  INSERT INTO stock_moves (
    tipo,
    product_id,
    cantidad,
    from_location_id,
    to_location_id,
    notas,
    user_id
  )
  VALUES (
    'ajuste',
    p_product_id,
    ABS(v_diferencia),
    CASE WHEN v_diferencia < 0 THEN p_location_id ELSE NULL END,
    CASE WHEN v_diferencia > 0 THEN p_location_id ELSE NULL END,
    'Ajuste de inventario: ' || p_razon || '. Stock anterior: ' || v_stock_actual || ', Stock nuevo: ' || p_cantidad_nueva,
    auth.uid()
  )
  RETURNING id INTO v_move_id;
  
  RETURN v_move_id;
END;
$$;


-- 10. TRIGGER: actualizar_stock_despues_movimiento
CREATE OR REPLACE FUNCTION trigger_actualizar_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_stock_by_location();
  PERFORM verificar_alertas_stock();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_stock_moves_after_insert_update
AFTER INSERT OR UPDATE OR DELETE ON stock_moves
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_actualizar_stock();


-- 11. RLS POLICIES MEJORADAS

-- stock_locations: RLS por rol
DROP POLICY IF EXISTS "Usuarios: ven ubicaciones activas" ON stock_locations;

CREATE POLICY "Admin: ve todas las ubicaciones"
ON stock_locations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operador: ve ubicaciones de su branch"
ON stock_locations FOR SELECT
USING (
  has_role(auth.uid(), 'operador') AND 
  branch_id = get_user_branch(auth.uid())
);

CREATE POLICY "Técnico: ve solo su camioneta"
ON stock_locations FOR SELECT
USING (
  has_role(auth.uid(), 'tecnico') AND 
  tipo = 'camioneta' AND
  activa = TRUE
);

CREATE POLICY "Vendedor: ve bodegas de su branch"
ON stock_locations FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor') AND
  tipo = 'bodega' AND
  branch_id = get_user_branch(auth.uid())
);

-- stock_moves: RLS estricto
DROP POLICY IF EXISTS "Técnico: ve movimientos de su camioneta" ON stock_moves;
DROP POLICY IF EXISTS "Técnico: crea movimientos en su camioneta" ON stock_moves;

CREATE POLICY "Admin: ve todos los movimientos"
ON stock_moves FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operador: ve movimientos de su branch"
ON stock_moves FOR SELECT
USING (
  has_role(auth.uid(), 'operador') AND
  (
    from_location_id IN (
      SELECT id FROM stock_locations WHERE branch_id = get_user_branch(auth.uid())
    )
    OR
    to_location_id IN (
      SELECT id FROM stock_locations WHERE branch_id = get_user_branch(auth.uid())
    )
  )
);

CREATE POLICY "Técnico: ve movimientos de su camioneta"
ON stock_moves FOR SELECT
USING (
  has_role(auth.uid(), 'tecnico') AND
  (
    from_location_id IN (
      SELECT id FROM stock_locations WHERE tipo = 'camioneta' AND activa = TRUE
    )
    OR
    to_location_id IN (
      SELECT id FROM stock_locations WHERE tipo = 'camioneta' AND activa = TRUE
    )
  )
);

CREATE POLICY "Técnico: crea movimientos desde su camioneta"
ON stock_moves FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tecnico') AND
  user_id = auth.uid() AND
  tipo IN ('consumo', 'devolucion') AND
  from_location_id IN (
    SELECT id FROM stock_locations WHERE tipo = 'camioneta' AND activa = TRUE
  )
);

-- product_serials: RLS
CREATE POLICY "Admin: gestiona serials"
ON product_serials FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operador: ve serials de su branch"
ON product_serials FOR SELECT
USING (
  has_role(auth.uid(), 'operador') AND
  location_id IN (
    SELECT id FROM stock_locations WHERE branch_id = get_user_branch(auth.uid())
  )
);

CREATE POLICY "Técnico: ve serials de su camioneta"
ON product_serials FOR SELECT
USING (
  has_role(auth.uid(), 'tecnico') AND
  location_id IN (
    SELECT id FROM stock_locations WHERE tipo = 'camioneta' AND activa = TRUE
  )
);

-- stock_alerts: RLS
CREATE POLICY "Admin: gestiona alertas"
ON stock_alerts FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Operador: ve alertas de su branch"
ON stock_alerts FOR SELECT
USING (
  has_role(auth.uid(), 'operador') AND
  location_id IN (
    SELECT id FROM stock_locations WHERE branch_id = get_user_branch(auth.uid())
  )
);


-- 12. ÍNDICES ADICIONALES
CREATE INDEX idx_stock_moves_product_fecha ON stock_moves(product_id, fecha DESC);
CREATE INDEX idx_stock_moves_location_fecha ON stock_moves(from_location_id, to_location_id, fecha DESC);
CREATE INDEX idx_stock_moves_tipo ON stock_moves(tipo);


-- 13. REFRESCAR VISTA MATERIALIZADA INICIAL
SELECT refresh_stock_by_location();