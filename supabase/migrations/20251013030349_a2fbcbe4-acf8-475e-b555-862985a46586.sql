-- Poblar tabla settings con configuraciones iniciales
INSERT INTO settings (clave, valor, descripcion, tipo_dato) VALUES
  ('moneda', 'CLP', 'Moneda del sistema', 'text'),
  ('iva_porcentaje', '19', 'Porcentaje de IVA', 'number'),
  ('timezone', 'America/Santiago', 'Zona horaria', 'text'),
  
  -- Información de la empresa
  ('empresa_razon_social', 'Autolock SpA', 'Razón social de la empresa', 'text'),
  ('empresa_rut', '76.XXX.XXX-X', 'RUT de la empresa', 'text'),
  ('empresa_direccion', 'Av. Providencia 123, Santiago', 'Dirección principal', 'text'),
  ('empresa_telefono', '+56 9 1234 5678', 'Teléfono de contacto', 'text'),
  ('empresa_email', 'contacto@autolock.cl', 'Email de contacto', 'text'),
  ('empresa_sitio_web', 'https://autolock.cl', 'Sitio web', 'text'),
  ('empresa_logo_url', '', 'URL del logo de la empresa', 'text'),
  
  -- Integraciones
  ('mapbox_api_key', '', 'API Key de Mapbox para mapas', 'secret'),
  ('onesignal_app_id', '', 'App ID de OneSignal', 'secret'),
  ('onesignal_api_key', '', 'API Key de OneSignal', 'secret'),
  ('whatsapp_api_url', '', 'URL de API de WhatsApp Business', 'text'),
  
  -- Numeradores
  ('numerador_cotizacion_prefijo', 'COT', 'Prefijo para cotizaciones', 'text'),
  ('numerador_cotizacion_padding', '4', 'Padding numérico', 'number'),
  ('numerador_ot_prefijo', 'OT', 'Prefijo para órdenes de trabajo', 'text'),
  ('numerador_ot_padding', '4', 'Padding numérico', 'number'),
  ('numerador_suscripcion_prefijo', 'SUBS', 'Prefijo para suscripciones', 'text'),
  ('numerador_suscripcion_padding', '4', 'Padding numérico', 'number'),
  
  -- Respaldos
  ('backup_enabled', 'false', 'Habilitar respaldos automáticos', 'boolean'),
  ('backup_frequency_days', '7', 'Frecuencia de respaldos (días)', 'number'),
  ('backup_retention_days', '90', 'Días de retención de respaldos', 'number')
ON CONFLICT (clave) DO NOTHING;

-- Función para realizar respaldo del sistema
CREATE OR REPLACE FUNCTION realizar_respaldo_sistema()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_backup_data JSONB;
  v_backup_id TEXT;
  v_timestamp TEXT;
BEGIN
  v_timestamp := TO_CHAR(NOW(), 'YYYY-MM-DD_HH24-MI-SS');
  v_backup_id := 'backup_' || v_timestamp;
  
  -- Construir JSON con datos de todas las tablas críticas
  v_backup_data := jsonb_build_object(
    'backup_id', v_backup_id,
    'backup_timestamp', NOW(),
    'clients', (SELECT jsonb_agg(to_jsonb(c)) FROM clients c),
    'vehicles', (SELECT jsonb_agg(to_jsonb(v)) FROM vehicles v),
    'quotes', (SELECT jsonb_agg(to_jsonb(q)) FROM quotes q),
    'work_orders', (SELECT jsonb_agg(to_jsonb(wo)) FROM work_orders wo),
    'subscriptions', (SELECT jsonb_agg(to_jsonb(s)) FROM subscriptions s),
    'products', (SELECT jsonb_agg(to_jsonb(p)) FROM products p),
    'services', (SELECT jsonb_agg(to_jsonb(s)) FROM services s),
    'settings', (SELECT jsonb_agg(to_jsonb(st)) FROM settings st)
  );
  
  RETURN v_backup_data;
END;
$$;

-- Función para obtener bitácora de auditoría con filtros
CREATE OR REPLACE FUNCTION obtener_bitacora_auditoria(
  p_fecha_desde DATE,
  p_fecha_hasta DATE,
  p_tabla TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_accion TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  fecha_hora TIMESTAMPTZ,
  tabla TEXT,
  accion TEXT,
  user_id UUID,
  user_nombre TEXT,
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.timestamp as fecha_hora,
    al.tabla,
    al.accion,
    al.user_id,
    CONCAT(p.nombre, ' ', COALESCE(p.apellido, '')) as user_nombre,
    al.registro_id,
    al.datos_anteriores,
    al.datos_nuevos
  FROM audit_log al
  LEFT JOIN profiles p ON p.id = al.user_id
  WHERE al.timestamp::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    AND (p_tabla IS NULL OR al.tabla = p_tabla)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_accion IS NULL OR al.accion = p_accion)
  ORDER BY al.timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Crear buckets de Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para bucket backups
CREATE POLICY "Admin: select backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin: insert backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin: update backups"
ON storage.objects FOR UPDATE
USING (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin: delete backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'));

-- RLS para bucket company-assets
CREATE POLICY "Admin: insert company-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos leen company-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');