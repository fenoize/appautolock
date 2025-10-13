-- Corregir warnings de seguridad de las funciones

-- 1. Corregir calcular_subtotal_quote_item
CREATE OR REPLACE FUNCTION public.calcular_subtotal_quote_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

-- 2. Corregir generar_token_aprobacion
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

-- 3. Agregar RLS policies faltantes para counters
CREATE POLICY "Admin: gestiona counters"
ON public.counters
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema: lee counters"
ON public.counters
FOR SELECT
USING (true);

-- Enable RLS on counters
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;

-- 4. Agregar RLS policies para notifications
CREATE POLICY "Admin: gestiona notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Agregar RLS policies para stock_locations
CREATE POLICY "Admin: gestiona stock_locations"
ON public.stock_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios: ven ubicaciones activas"
ON public.stock_locations
FOR SELECT
USING (activa = true);

-- Enable RLS on stock_locations
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;

-- 6. Agregar RLS policies para subscription_events
CREATE POLICY "Admin: gestiona subscription_events"
ON public.subscription_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on subscription_events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- 7. Agregar RLS policies para subscription_plans
CREATE POLICY "Admin: gestiona subscription_plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios: ven planes activos"
ON public.subscription_plans
FOR SELECT
USING (activo = true);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 8. Agregar RLS policies para suppliers
CREATE POLICY "Admin: gestiona suppliers"
ON public.suppliers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios: ven suppliers activos"
ON public.suppliers
FOR SELECT
USING (activo = true);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;