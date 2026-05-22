
-- vehicle_catalog
CREATE TABLE public.vehicle_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio_desde INT,
  anio_hasta INT,
  tipo_combustible TEXT CHECK (tipo_combustible IN ('Bencina','Diesel','GLP','Eléctrico','Híbrido','Cualquiera')),
  tipo_encendido TEXT CHECK (tipo_encendido IN ('Llave','Push-Start','Sin llave','Cualquiera')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_catalog_marca_modelo ON public.vehicle_catalog(marca, modelo);

ALTER TABLE public.vehicle_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados ven vehicle_catalog"
  ON public.vehicle_catalog FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin gestiona vehicle_catalog"
  ON public.vehicle_catalog FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- product_compatibility
CREATE TABLE public.product_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vehicle_catalog_id UUID NOT NULL REFERENCES public.vehicle_catalog(id) ON DELETE CASCADE,
  estado TEXT NOT NULL CHECK (estado IN ('verde','amarillo','rojo')),
  observaciones TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, vehicle_catalog_id)
);

CREATE INDEX idx_product_compatibility_product ON public.product_compatibility(product_id);
CREATE INDEX idx_product_compatibility_vehicle ON public.product_compatibility(vehicle_catalog_id);

ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados ven product_compatibility"
  ON public.product_compatibility FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin gestiona product_compatibility"
  ON public.product_compatibility FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER trg_product_compatibility_updated_at
  BEFORE UPDATE ON public.product_compatibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed ~50 modelos populares en Chile
INSERT INTO public.vehicle_catalog (marca, modelo, anio_desde, anio_hasta, tipo_combustible, tipo_encendido) VALUES
('Chevrolet','Sail',2010,2024,'Bencina','Llave'),
('Chevrolet','Spark',2005,2024,'Bencina','Llave'),
('Chevrolet','Onix',2017,2024,'Bencina','Llave'),
('Chevrolet','Tracker',2013,2024,'Bencina','Push-Start'),
('Chevrolet','Captiva',2007,2018,'Diesel','Llave'),
('Chevrolet','Cruze',2010,2019,'Bencina','Llave'),
('Hyundai','Accent',2005,2024,'Bencina','Llave'),
('Hyundai','Elantra',2007,2024,'Bencina','Push-Start'),
('Hyundai','Tucson',2005,2024,'Bencina','Push-Start'),
('Hyundai','Santa Fe',2006,2024,'Diesel','Push-Start'),
('Hyundai','Creta',2017,2024,'Bencina','Llave'),
('Hyundai','i10',2010,2024,'Bencina','Llave'),
('Kia','Morning',2005,2024,'Bencina','Llave'),
('Kia','Rio',2005,2024,'Bencina','Llave'),
('Kia','Cerato',2008,2024,'Bencina','Push-Start'),
('Kia','Sportage',2005,2024,'Bencina','Push-Start'),
('Kia','Sorento',2008,2024,'Diesel','Push-Start'),
('Kia','Soul',2010,2024,'Bencina','Llave'),
('Toyota','Yaris',2005,2024,'Bencina','Llave'),
('Toyota','Corolla',2005,2024,'Bencina','Push-Start'),
('Toyota','Hilux',2005,2024,'Diesel','Llave'),
('Toyota','RAV4',2006,2024,'Híbrido','Push-Start'),
('Toyota','Rush',2018,2024,'Bencina','Llave'),
('Toyota','Prius',2010,2024,'Híbrido','Push-Start'),
('Suzuki','Swift',2007,2024,'Bencina','Llave'),
('Suzuki','Baleno',2016,2024,'Bencina','Llave'),
('Suzuki','Vitara',2005,2024,'Bencina','Push-Start'),
('Suzuki','Grand Vitara',2006,2018,'Bencina','Llave'),
('Suzuki','S-Presso',2020,2024,'Bencina','Llave'),
('Nissan','March',2011,2024,'Bencina','Llave'),
('Nissan','Versa',2012,2024,'Bencina','Llave'),
('Nissan','Sentra',2007,2024,'Bencina','Push-Start'),
('Nissan','Qashqai',2008,2024,'Bencina','Push-Start'),
('Nissan','X-Trail',2005,2024,'Bencina','Push-Start'),
('Nissan','Navara',2010,2024,'Diesel','Llave'),
('Ford','Fiesta',2005,2019,'Bencina','Llave'),
('Ford','Focus',2005,2019,'Bencina','Llave'),
('Ford','EcoSport',2005,2024,'Bencina','Llave'),
('Ford','Ranger',2005,2024,'Diesel','Push-Start'),
('Ford','Escape',2008,2024,'Bencina','Push-Start'),
('Peugeot','208',2013,2024,'Bencina','Llave'),
('Peugeot','301',2013,2024,'Bencina','Llave'),
('Peugeot','2008',2014,2024,'Bencina','Push-Start'),
('Peugeot','3008',2010,2024,'Diesel','Push-Start'),
('Renault','Sandero',2010,2024,'Bencina','Llave'),
('Renault','Logan',2008,2024,'Bencina','Llave'),
('Renault','Duster',2012,2024,'Bencina','Llave'),
('Renault','Captur',2015,2024,'Bencina','Push-Start'),
('Volkswagen','Gol',2005,2024,'Bencina','Llave'),
('Volkswagen','Polo',2005,2024,'Bencina','Llave'),
('Volkswagen','Vento',2012,2024,'Bencina','Llave'),
('Volkswagen','Tiguan',2008,2024,'Bencina','Push-Start'),
('Volkswagen','Amarok',2010,2024,'Diesel','Push-Start');
