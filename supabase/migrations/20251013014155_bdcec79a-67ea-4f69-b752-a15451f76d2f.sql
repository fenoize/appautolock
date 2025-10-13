-- =====================================================
-- FASE 2: SERVICIOS Y COTIZACIONES
-- =====================================================

-- 1. CREATE VIEW para ocultar precio_costo a vendedores/operadores
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  id,
  sku,
  nombre,
  tipo,
  unidad_medida,
  precio_venta,
  aplica_iva,
  serializable,
  stock_minimo,
  activo,
  supplier_id,
  created_at,
  updated_at
FROM public.products;

-- 2. RLS para products_public VIEW
ALTER VIEW public.products_public SET (security_invoker = true);

-- 3. Política para que vendedores/operadores vean solo products_public
CREATE POLICY "Vendedor/Operador: ve productos sin costo"
ON public.products
FOR SELECT
USING (
  (has_role(auth.uid(), 'vendedor'::app_role) OR has_role(auth.uid(), 'operador'::app_role))
  AND activo = true
);

-- 4. Política actualizada para services_products (lectura para armar cotizaciones)
CREATE POLICY "Vendedor/Operador: ve mapeo servicios-productos"
ON public.services_products
FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor'::app_role) OR 
  has_role(auth.uid(), 'operador'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin: gestiona servicios-productos"
ON public.services_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on services_products
ALTER TABLE public.services_products ENABLE ROW LEVEL SECURITY;

-- 5. FUNCIÓN: Recalcular totales de cotización automáticamente
CREATE OR REPLACE FUNCTION public.recalcular_totales_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_neto numeric;
  v_iva numeric;
  v_total numeric;
  v_quote_id uuid;
BEGIN
  -- Obtener quote_id del registro afectado
  v_quote_id := COALESCE(NEW.quote_id, OLD.quote_id);
  
  -- Calcular neto sumando subtotales de todos los items
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_neto
  FROM quote_items
  WHERE quote_id = v_quote_id;
  
  -- Calcular IVA (19%)
  v_iva := ROUND(v_neto * 0.19, 0);
  v_total := v_neto + v_iva;
  
  -- Actualizar cotización
  UPDATE quotes
  SET 
    neto = v_neto,
    iva = v_iva,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_quote_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. TRIGGER: Recalcular totales cuando cambian items
DROP TRIGGER IF EXISTS trigger_recalcular_totales_quote ON public.quote_items;
CREATE TRIGGER trigger_recalcular_totales_quote
AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION public.recalcular_totales_quote();

-- 7. FUNCIÓN: Expirar cotizaciones vencidas
CREATE OR REPLACE FUNCTION public.expirar_cotizaciones_vencidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quotes
  SET estado = 'expirada'::quote_status
  WHERE estado IN ('borrador'::quote_status, 'enviada'::quote_status)
  AND (fecha_emision + INTERVAL '1 day' * validez_dias) < NOW();
END;
$$;

-- 8. ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_quotes_vendedor ON public.quotes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_estado ON public.quotes(estado);
CREATE INDEX IF NOT EXISTS idx_quotes_branch ON public.quotes(branch_id);
CREATE INDEX IF NOT EXISTS idx_quotes_fecha_emision ON public.quotes(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_services_products_service ON public.services_products(service_id);
CREATE INDEX IF NOT EXISTS idx_services_products_product ON public.services_products(product_id);

-- 9. FUNCIÓN auxiliar: Obtener branch del usuario
CREATE OR REPLACE FUNCTION public.get_user_branch(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id
$$;

-- 10. Trigger para quote_items: calcular subtotal automáticamente
CREATE OR REPLACE FUNCTION public.calcular_subtotal_quote_item()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcular subtotal: (cantidad * precio_unitario) - (descuento%)
  NEW.subtotal := ROUND(
    NEW.cantidad * NEW.precio_unitario * (1 - COALESCE(NEW.descuento_porcentaje, 0) / 100),
    0
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calcular_subtotal ON public.quote_items;
CREATE TRIGGER trigger_calcular_subtotal
BEFORE INSERT OR UPDATE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION public.calcular_subtotal_quote_item();

-- 11. Storage bucket para PDFs de cotizaciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-pdfs',
  'quote-pdfs',
  true,
  5242880, -- 5MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 12. RLS para storage bucket quote-pdfs
CREATE POLICY "Usuarios autenticados pueden subir PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quote-pdfs');

CREATE POLICY "PDFs son públicamente accesibles"
ON storage.objects
FOR SELECT
USING (bucket_id = 'quote-pdfs');

CREATE POLICY "Usuarios pueden actualizar sus PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'quote-pdfs');

-- 13. Función para generar token de aprobación de cotización
CREATE OR REPLACE FUNCTION public.generar_token_aprobacion(quote_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_generado text;
BEGIN
  -- Generar token único (UUID sin guiones + timestamp)
  token_generado := REPLACE(gen_random_uuid()::text, '-', '') || 
                    EXTRACT(EPOCH FROM NOW())::bigint::text;
  
  RETURN token_generado;
END;
$$;

-- 14. Tabla para tokens de aprobación de cotizaciones
CREATE TABLE IF NOT EXISTS public.quote_approval_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expira_at timestamp with time zone NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  usado boolean DEFAULT false,
  usado_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW()
);

-- RLS para quote_approval_tokens (acceso público para aprobación)
ALTER TABLE public.quote_approval_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tokens de aprobación son accesibles públicamente"
ON public.quote_approval_tokens
FOR SELECT
USING (true);

CREATE POLICY "Solo sistema puede crear tokens"
ON public.quote_approval_tokens
FOR INSERT
WITH CHECK (false); -- Solo via funciones SECURITY DEFINER

-- 15. Índices para quote_approval_tokens
CREATE INDEX IF NOT EXISTS idx_quote_approval_tokens_token ON public.quote_approval_tokens(token);
CREATE INDEX IF NOT EXISTS idx_quote_approval_tokens_quote ON public.quote_approval_tokens(quote_id);