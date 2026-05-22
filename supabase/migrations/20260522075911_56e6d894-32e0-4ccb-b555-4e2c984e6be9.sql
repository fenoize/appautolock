CREATE TABLE IF NOT EXISTS public.quote_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  user_id UUID,
  notas TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON public.quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_created_at ON public.quote_events(created_at DESC);

ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados ven eventos de cotizaciones"
  ON public.quote_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados crean eventos de cotizaciones"
  ON public.quote_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin gestiona eventos de cotizaciones"
  ON public.quote_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));