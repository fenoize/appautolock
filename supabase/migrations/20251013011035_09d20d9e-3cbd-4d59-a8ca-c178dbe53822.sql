-- =====================================================
-- AUTOLOCK - SISTEMA DE GESTIÓN DE SERVICIOS
-- Migración Base - Tablas, RLS, Seeds y Funciones
-- =====================================================

-- 1. ENUMS Y TIPOS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'tecnico', 'vendedor', 'cliente');
CREATE TYPE public.client_type AS ENUM ('empresa', 'persona');
CREATE TYPE public.client_status AS ENUM ('prospecto', 'activo', 'mora', 'suspendido');
CREATE TYPE public.stock_move_type AS ENUM ('compra', 'traslado', 'reserva', 'consumo', 'devolucion', 'ajuste');
CREATE TYPE public.quote_status AS ENUM ('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada');
CREATE TYPE public.wo_status AS ENUM ('programada', 'en_ruta', 'en_proceso', 'completada', 'cancelada');
CREATE TYPE public.subscription_status AS ENUM ('activa', 'mora', 'suspendida', 'cancelada');
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'whatsapp');
CREATE TYPE public.notification_status AS ENUM ('pendiente', 'enviado', 'fallido');
CREATE TYPE public.stock_location_type AS ENUM ('bodega', 'camioneta');
CREATE TYPE public.invitation_status AS ENUM ('pendiente', 'aceptada', 'expirada');

-- 2. TABLA DE SUCURSALES
-- =====================================================
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PERFILES
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  phone TEXT,
  branch_id UUID REFERENCES public.branches(id),
  estado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE ROLES DE USUARIO
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 5. TABLA DE CLIENTES
-- =====================================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo client_type NOT NULL,
  rut TEXT,
  dv TEXT,
  pasaporte TEXT,
  razon_social TEXT,
  giro TEXT,
  nombre_comercial TEXT,
  email_principal TEXT,
  emails TEXT[],
  telefonos TEXT[],
  estado client_status DEFAULT 'prospecto',
  vendedor_id UUID REFERENCES public.profiles(id),
  branch_id UUID REFERENCES public.branches(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_identificacion CHECK (
    (tipo = 'empresa' AND rut IS NOT NULL AND dv IS NOT NULL) OR
    (tipo = 'persona' AND (rut IS NOT NULL AND dv IS NOT NULL) OR pasaporte IS NOT NULL)
  )
);

-- 6. CONTACTOS DE CLIENTES
-- =====================================================
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cargo TEXT,
  es_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DIRECCIONES DE CLIENTES
-- =====================================================
CREATE TABLE public.client_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  alias TEXT,
  direccion TEXT NOT NULL,
  comuna TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  region TEXT NOT NULL,
  codigo_postal TEXT,
  es_predeterminada BOOLEAN DEFAULT FALSE,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VEHÍCULOS
-- =====================================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  patente TEXT UNIQUE NOT NULL,
  vin TEXT,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER,
  combustible TEXT,
  odometro INTEGER,
  color TEXT,
  numero_motor TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SERVICIOS
-- =====================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(12, 2) NOT NULL,
  tiempo_estimado_minutos INTEGER,
  requiere_checklist BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PROVEEDORES
-- =====================================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  dv TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  condicion_pago TEXT,
  lead_time_dias INTEGER,
  moneda TEXT DEFAULT 'CLP',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rut, dv)
);

-- 11. PRODUCTOS
-- =====================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT,
  serializable BOOLEAN DEFAULT FALSE,
  unidad_medida TEXT DEFAULT 'UND',
  precio_costo DECIMAL(12, 2),
  precio_venta DECIMAL(12, 2),
  aplica_iva BOOLEAN DEFAULT TRUE,
  stock_minimo INTEGER DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RELACIÓN SERVICIOS-PRODUCTOS
-- =====================================================
CREATE TABLE public.services_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, product_id)
);

-- 13. UBICACIONES DE STOCK
-- =====================================================
CREATE TABLE public.stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  tipo stock_location_type NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MOVIMIENTOS DE STOCK
-- =====================================================
CREATE TABLE public.stock_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  tipo stock_move_type NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL,
  from_location_id UUID REFERENCES public.stock_locations(id),
  to_location_id UUID REFERENCES public.stock_locations(id),
  referencia TEXT,
  notas TEXT,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. COTIZACIONES
-- =====================================================
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  vendedor_id UUID REFERENCES public.profiles(id) NOT NULL,
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  fecha_emision TIMESTAMPTZ DEFAULT NOW(),
  validez_dias INTEGER DEFAULT 30,
  neto DECIMAL(12, 2) DEFAULT 0,
  iva DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  estado quote_status DEFAULT 'borrador',
  pdf_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ÍTEMS DE COTIZACIÓN
-- =====================================================
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  item_tipo TEXT NOT NULL,
  ref_id UUID,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ÓRDENES DE TRABAJO
-- =====================================================
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  tecnico_id UUID REFERENCES public.profiles(id),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  estado wo_status DEFAULT 'programada',
  fecha_programada TIMESTAMPTZ,
  ventana_inicio TIME,
  ventana_fin TIME,
  direccion_id UUID REFERENCES public.client_addresses(id),
  ubicacion_manual TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ÍTEMS DE ORDEN DE TRABAJO
-- =====================================================
CREATE TABLE public.wo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  item_tipo TEXT NOT NULL,
  ref_id UUID,
  nombre TEXT NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. PLANES DE SUSCRIPCIÓN
-- =====================================================
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  periodo_meses INTEGER NOT NULL,
  precio DECIMAL(12, 2) NOT NULL,
  dias_gracia INTEGER DEFAULT 0,
  suspension_automatica BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. SUSCRIPCIONES
-- =====================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  estado subscription_status DEFAULT 'activa',
  fecha_inicio DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. EVENTOS DE SUSCRIPCIÓN
-- =====================================================
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  user_id UUID REFERENCES public.profiles(id)
);

-- 22. NOTIFICACIONES
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla TEXT NOT NULL,
  canal notification_channel NOT NULL,
  evento TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  estado notification_status DEFAULT 'pendiente',
  payload JSONB,
  enviado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. ADJUNTOS
-- =====================================================
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad TEXT NOT NULL,
  entidad_id UUID NOT NULL,
  url TEXT NOT NULL,
  tipo_archivo TEXT,
  tamanio_bytes BIGINT,
  nombre_archivo TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. CONFIGURACIONES GLOBALES
-- =====================================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  tipo_dato TEXT DEFAULT 'text',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. CONTADORES PARA FOLIOS
-- =====================================================
CREATE TABLE public.counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL,
  anio INTEGER NOT NULL,
  secuencia INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clave, anio)
);

-- 26. LOG DE AUDITORÍA
-- =====================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla TEXT NOT NULL,
  registro_id UUID NOT NULL,
  accion TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 27. INVITACIONES DE USUARIOS
-- =====================================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  rol app_role NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  estado invitation_status DEFAULT 'pendiente',
  token TEXT UNIQUE NOT NULL,
  expira_at TIMESTAMPTZ NOT NULL,
  invitado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para verificar roles (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Función para obtener el branch del usuario
CREATE OR REPLACE FUNCTION public.get_user_branch(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id
$$;

-- Función para generar folios
CREATE OR REPLACE FUNCTION public.generar_folio(prefijo TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  anio_actual INTEGER := EXTRACT(YEAR FROM NOW());
  nueva_secuencia INTEGER;
  folio TEXT;
BEGIN
  INSERT INTO public.counters (clave, anio, secuencia)
  VALUES (prefijo, anio_actual, 1)
  ON CONFLICT (clave, anio) DO UPDATE
  SET secuencia = counters.secuencia + 1
  RETURNING secuencia INTO nueva_secuencia;
  
  folio := prefijo || '-' || anio_actual || '-' || LPAD(nueva_secuencia::TEXT, 4, '0');
  RETURN folio;
END;
$$;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PROFILES
CREATE POLICY "Admin: total acceso a profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Usuarios ven su propio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS USER_ROLES
CREATE POLICY "Admin: total acceso a user_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Usuarios ven sus propios roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- POLÍTICAS BRANCHES
CREATE POLICY "Todos ven sucursales activas" ON public.branches FOR SELECT USING (activa = TRUE);
CREATE POLICY "Admin: gestiona sucursales" ON public.branches FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- POLÍTICAS CLIENTS
CREATE POLICY "Admin: total acceso a clientes" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operador: ve clientes de su branch" ON public.clients FOR SELECT USING (
  public.has_role(auth.uid(), 'operador') AND branch_id = public.get_user_branch(auth.uid())
);
CREATE POLICY "Vendedor: ve sus clientes" ON public.clients FOR SELECT USING (
  public.has_role(auth.uid(), 'vendedor') AND vendedor_id = auth.uid()
);
CREATE POLICY "Cliente: ve sus propios datos" ON public.clients FOR SELECT USING (
  public.has_role(auth.uid(), 'cliente') AND id = auth.uid()
);

-- POLÍTICAS CLIENT_CONTACTS
CREATE POLICY "Admin: total acceso a contactos" ON public.client_contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operador: ve contactos" ON public.client_contacts FOR SELECT USING (public.has_role(auth.uid(), 'operador'));

-- POLÍTICAS CLIENT_ADDRESSES
CREATE POLICY "Admin: total acceso a direcciones" ON public.client_addresses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operador: ve direcciones" ON public.client_addresses FOR SELECT USING (public.has_role(auth.uid(), 'operador'));

-- POLÍTICAS VEHICLES
CREATE POLICY "Admin: total acceso a vehículos" ON public.vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operador: ve vehículos" ON public.vehicles FOR SELECT USING (public.has_role(auth.uid(), 'operador'));
CREATE POLICY "Técnico: ve vehículos de sus OTs" ON public.vehicles FOR SELECT USING (
  public.has_role(auth.uid(), 'tecnico') AND 
  EXISTS (SELECT 1 FROM public.work_orders WHERE vehicle_id = vehicles.id AND tecnico_id = auth.uid())
);

-- POLÍTICAS SERVICES
CREATE POLICY "Todos ven servicios activos" ON public.services FOR SELECT USING (activo = TRUE);
CREATE POLICY "Admin: gestiona servicios" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- POLÍTICAS PRODUCTS
CREATE POLICY "Admin: total acceso a productos" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Operador: ve productos" ON public.products FOR SELECT USING (
  public.has_role(auth.uid(), 'operador') OR public.has_role(auth.uid(), 'vendedor')
);
CREATE POLICY "Técnico: ve productos activos" ON public.products FOR SELECT USING (
  public.has_role(auth.uid(), 'tecnico') AND activo = TRUE
);

-- POLÍTICAS STOCK_MOVES
CREATE POLICY "Admin: total acceso a movimientos" ON public.stock_moves FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Técnico: crea movimientos" ON public.stock_moves FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'tecnico') AND user_id = auth.uid()
);
CREATE POLICY "Técnico: ve sus movimientos" ON public.stock_moves FOR SELECT USING (
  public.has_role(auth.uid(), 'tecnico') AND user_id = auth.uid()
);

-- POLÍTICAS QUOTES
CREATE POLICY "Admin: total acceso a cotizaciones" ON public.quotes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendedor: gestiona sus cotizaciones" ON public.quotes FOR ALL USING (
  public.has_role(auth.uid(), 'vendedor') AND vendedor_id = auth.uid()
);
CREATE POLICY "Operador: ve cotizaciones de su branch" ON public.quotes FOR SELECT USING (
  public.has_role(auth.uid(), 'operador') AND branch_id = public.get_user_branch(auth.uid())
);

-- POLÍTICAS QUOTE_ITEMS
CREATE POLICY "Admin: total acceso a items de cotización" ON public.quote_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendedor: gestiona items de sus cotizaciones" ON public.quote_items FOR ALL USING (
  public.has_role(auth.uid(), 'vendedor') AND 
  EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND quotes.vendedor_id = auth.uid())
);

-- POLÍTICAS WORK_ORDERS
CREATE POLICY "Admin: total acceso a OTs" ON public.work_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Técnico: gestiona sus OTs" ON public.work_orders FOR ALL USING (
  public.has_role(auth.uid(), 'tecnico') AND tecnico_id = auth.uid()
);
CREATE POLICY "Operador: ve OTs de su branch" ON public.work_orders FOR SELECT USING (
  public.has_role(auth.uid(), 'operador') AND branch_id = public.get_user_branch(auth.uid())
);

-- POLÍTICAS WO_ITEMS
CREATE POLICY "Admin: total acceso a items de OT" ON public.wo_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Técnico: gestiona items de sus OTs" ON public.wo_items FOR ALL USING (
  public.has_role(auth.uid(), 'tecnico') AND 
  EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = wo_items.wo_id AND work_orders.tecnico_id = auth.uid())
);

-- POLÍTICAS SUBSCRIPTIONS
CREATE POLICY "Admin: total acceso a suscripciones" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Cliente: ve sus suscripciones" ON public.subscriptions FOR SELECT USING (
  public.has_role(auth.uid(), 'cliente') AND client_id = auth.uid()
);

-- POLÍTICAS SETTINGS
CREATE POLICY "Admin: gestiona configuración" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Todos leen configuración" ON public.settings FOR SELECT USING (TRUE);

-- POLÍTICAS INVITATIONS
CREATE POLICY "Admin: gestiona invitaciones" ON public.invitations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- POLÍTICAS AUDIT_LOG
CREATE POLICY "Admin: ve audit log" ON public.audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- SEEDS DE DATOS INICIALES
-- =====================================================

-- Sucursales
INSERT INTO public.branches (nombre, codigo, direccion) VALUES
  ('Santiago Centro', 'STG', 'Av. Providencia 1234, Santiago'),
  ('Viña del Mar', 'VDM', 'Av. Libertad 567, Viña del Mar');

-- Settings
INSERT INTO public.settings (clave, valor, descripcion, tipo_dato) VALUES
  ('IVA', '19', 'Porcentaje de IVA aplicable', 'number'),
  ('MONEDA', 'CLP', 'Moneda por defecto', 'text'),
  ('EMAIL_NOTIFICACIONES', 'notificaciones@autolock.cl', 'Email de notificaciones', 'text');

-- Stock locations por sucursal
INSERT INTO public.stock_locations (codigo, nombre, tipo, branch_id) 
SELECT 'BOD-STG', 'Bodega Santiago', 'bodega', id FROM public.branches WHERE codigo = 'STG';

INSERT INTO public.stock_locations (codigo, nombre, tipo, branch_id) 
SELECT 'BOD-VDM', 'Bodega Viña del Mar', 'bodega', id FROM public.branches WHERE codigo = 'VDM';

INSERT INTO public.stock_locations (codigo, nombre, tipo, branch_id) 
SELECT 'CAM-01', 'Camioneta Demo 01', 'camioneta', id FROM public.branches WHERE codigo = 'STG';