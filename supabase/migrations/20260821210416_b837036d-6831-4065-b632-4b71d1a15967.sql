CREATE TABLE public.proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  rut text,
  contacto text,
  email text,
  telefono text,
  direccion text,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proveedores TO authenticated;
GRANT ALL ON public.proveedores TO service_role;

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users can manage proveedores"
  ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.stock_moves ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores(id);