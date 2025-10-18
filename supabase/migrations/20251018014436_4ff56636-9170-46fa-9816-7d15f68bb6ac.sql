-- FASE 1: Expansión del Sistema de Notificaciones

-- 1.1 Ampliar tabla notification_templates con nuevos campos
ALTER TABLE notification_templates 
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS variables_disponibles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS subject_preview TEXT,
ADD COLUMN IF NOT EXISTS body_preview TEXT;

-- 1.2 Crear tabla de variables del sistema
CREATE TABLE IF NOT EXISTS notification_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  variable TEXT NOT NULL,
  descripcion TEXT,
  ejemplo TEXT,
  tipo_dato TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(categoria, variable)
);

-- 1.3 Crear tabla de condiciones de envío
CREATE TABLE IF NOT EXISTS notification_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  operador TEXT NOT NULL,
  valor TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 1.4 Insertar variables del sistema

-- Variables de Cliente
INSERT INTO notification_variables (categoria, variable, descripcion, ejemplo, tipo_dato) VALUES
('client', 'cliente.razon_social', 'Razón social del cliente', 'Transportes ABC S.A.', 'text'),
('client', 'cliente.nombre_comercial', 'Nombre comercial', 'Transportes ABC', 'text'),
('client', 'cliente.rut', 'RUT del cliente', '12345678-9', 'text'),
('client', 'cliente.email_principal', 'Email principal', 'contacto@abc.cl', 'text'),
('client', 'cliente.telefonos', 'Teléfonos', '+56912345678', 'text')
ON CONFLICT (categoria, variable) DO NOTHING;

-- Variables de Vehículo
INSERT INTO notification_variables (categoria, variable, descripcion, ejemplo, tipo_dato) VALUES
('vehicle', 'vehiculo.patente', 'Patente del vehículo', 'ABCD12', 'text'),
('vehicle', 'vehiculo.marca', 'Marca', 'Toyota', 'text'),
('vehicle', 'vehiculo.modelo', 'Modelo', 'Hilux', 'text'),
('vehicle', 'vehiculo.anio', 'Año', '2023', 'number'),
('vehicle', 'vehiculo.combustible', 'Tipo de combustible', 'Diesel', 'text')
ON CONFLICT (categoria, variable) DO NOTHING;

-- Variables de Cotización
INSERT INTO notification_variables (categoria, variable, descripcion, ejemplo, tipo_dato) VALUES
('quote', 'cotizacion.folio', 'Folio de la cotización', 'COT-2025-0001', 'text'),
('quote', 'cotizacion.fecha_emision', 'Fecha de emisión', '2025-01-15', 'date'),
('quote', 'cotizacion.validez_dias', 'Días de validez', '30', 'number'),
('quote', 'cotizacion.neto', 'Monto neto', '$450.000', 'currency'),
('quote', 'cotizacion.iva', 'IVA', '$85.500', 'currency'),
('quote', 'cotizacion.total', 'Total', '$535.500', 'currency'),
('quote', 'cotizacion.estado', 'Estado', 'enviada', 'text'),
('quote', 'cotizacion.vendedor_nombre', 'Nombre del vendedor', 'Juan Pérez', 'text'),
('quote', 'cotizacion.link_aprobacion', 'Link de aprobación', 'https://...', 'text')
ON CONFLICT (categoria, variable) DO NOTHING;

-- Variables de Orden de Trabajo
INSERT INTO notification_variables (categoria, variable, descripcion, ejemplo, tipo_dato) VALUES
('work_order', 'ot.folio', 'Folio de la OT', 'OT-2025-0001', 'text'),
('work_order', 'ot.fecha_programada', 'Fecha programada', '2025-01-20', 'date'),
('work_order', 'ot.ventana_inicio', 'Hora inicio', '09:00', 'text'),
('work_order', 'ot.ventana_fin', 'Hora fin', '12:00', 'text'),
('work_order', 'ot.tecnico_nombre', 'Nombre del técnico', 'Carlos Silva', 'text'),
('work_order', 'ot.estado', 'Estado', 'asignada', 'text'),
('work_order', 'ot.notas', 'Notas', 'Cliente prefiere mañana', 'text'),
('work_order', 'ot.direccion', 'Dirección de servicio', 'Av. Principal 123', 'text')
ON CONFLICT (categoria, variable) DO NOTHING;

-- Variables de Suscripción
INSERT INTO notification_variables (categoria, variable, descripcion, ejemplo, tipo_dato) VALUES
('subscription', 'suscripcion.folio', 'Folio de la suscripción', 'SUB-2025-0001', 'text'),
('subscription', 'suscripcion.plan_nombre', 'Nombre del plan', 'Plan GPS Básico', 'text'),
('subscription', 'suscripcion.fecha_inicio', 'Fecha de inicio', '2025-01-01', 'date'),
('subscription', 'suscripcion.fecha_vencimiento', 'Fecha de vencimiento', '2025-07-01', 'date'),
('subscription', 'suscripcion.dias_restantes', 'Días restantes', '15', 'number'),
('subscription', 'suscripcion.precio', 'Precio', '$25.000', 'currency')
ON CONFLICT (categoria, variable) DO NOTHING;

-- Variables de Sistema
INSERT INTO notification_variables (categoria, variable, descripcion, ejemplo, tipo_dato) VALUES
('system', 'empresa.razon_social', 'Razón social de la empresa', 'Mi Empresa S.A.', 'text'),
('system', 'empresa.telefono', 'Teléfono de la empresa', '+56212345678', 'text'),
('system', 'empresa.email', 'Email de la empresa', 'info@empresa.cl', 'text'),
('system', 'empresa.sitio_web', 'Sitio web', 'www.empresa.cl', 'text'),
('system', 'sistema.fecha_actual', 'Fecha actual', '2025-01-18', 'date'),
('system', 'sistema.hora_actual', 'Hora actual', '14:30', 'text')
ON CONFLICT (categoria, variable) DO NOTHING;

-- 1.5 Insertar templates base para eventos de Cotizaciones
INSERT INTO notification_templates (evento, canal, asunto, cuerpo, categoria, descripcion, activa, variables_disponibles) VALUES
('quote_created', 'email', 'Cotización {{cotizacion.folio}} creada', 'Se ha creado la cotización {{cotizacion.folio}} para el cliente {{cliente.razon_social}}.', 'quote', 'Notificación interna cuando se crea una cotización', false, '["cotizacion.folio", "cliente.razon_social"]'::jsonb),
('quote_sent', 'email', 'Cotización {{cotizacion.folio}} - {{empresa.razon_social}}', 'Estimado/a {{cliente.razon_social}},\n\nAdjuntamos cotización {{cotizacion.folio}} por un total de {{cotizacion.total}}.\n\nVigencia: {{cotizacion.validez_dias}} días desde {{cotizacion.fecha_emision}}.\n\nSaludos,\n{{cotizacion.vendedor_nombre}}\n{{empresa.razon_social}}', 'quote', 'Email enviado al cliente con la cotización', true, '["cotizacion.folio", "cotizacion.total", "cotizacion.validez_dias", "cliente.razon_social", "empresa.razon_social"]'::jsonb),
('quote_accepted', 'email', 'Cotización {{cotizacion.folio}} aceptada', 'El cliente {{cliente.razon_social}} ha aceptado la cotización {{cotizacion.folio}} por {{cotizacion.total}}.', 'quote', 'Notificación al vendedor cuando se acepta una cotización', true, '["cotizacion.folio", "cotizacion.total", "cliente.razon_social"]'::jsonb),
('quote_rejected', 'email', 'Cotización {{cotizacion.folio}} rechazada', 'El cliente {{cliente.razon_social}} ha rechazado la cotización {{cotizacion.folio}}.', 'quote', 'Notificación al vendedor cuando se rechaza', false, '["cotizacion.folio", "cliente.razon_social"]'::jsonb),
('quote_expired', 'email', 'Cotización {{cotizacion.folio}} vencida', 'La cotización {{cotizacion.folio}} para {{cliente.razon_social}} ha vencido.', 'quote', 'Notificación cuando vence una cotización', false, '["cotizacion.folio", "cliente.razon_social"]'::jsonb),
('quote_reminder_3d', 'email', 'Recordatorio: Cotización {{cotizacion.folio}} vence en 3 días', 'Estimado/a {{cliente.razon_social}},\n\nLe recordamos que la cotización {{cotizacion.folio}} vence en 3 días ({{cotizacion.fecha_emision}}).\n\nSaludos,\n{{empresa.razon_social}}', 'quote', 'Recordatorio 3 días antes del vencimiento', false, '["cotizacion.folio", "cliente.razon_social"]'::jsonb),
('quote_reminder_1d', 'email', 'Recordatorio: Cotización {{cotizacion.folio}} vence mañana', 'Estimado/a {{cliente.razon_social}},\n\nLe recordamos que la cotización {{cotizacion.folio}} vence mañana.\n\nSaludos,\n{{empresa.razon_social}}', 'quote', 'Recordatorio 1 día antes del vencimiento', false, '["cotizacion.folio", "cliente.razon_social"]'::jsonb)
ON CONFLICT (evento, canal) DO NOTHING;

-- 1.6 Insertar templates para Órdenes de Trabajo
INSERT INTO notification_templates (evento, canal, asunto, cuerpo, categoria, descripcion, activa, variables_disponibles) VALUES
('wo_created', 'email', 'OT {{ot.folio}} creada', 'Se ha creado la orden de trabajo {{ot.folio}} para el cliente {{cliente.razon_social}}.', 'work_order', 'Notificación interna cuando se crea una OT', false, '["ot.folio", "cliente.razon_social"]'::jsonb),
('wo_assigned', 'email', 'OT {{ot.folio}} asignada - {{ot.fecha_programada}}', 'Hola {{ot.tecnico_nombre}},\n\nSe te ha asignado la OT {{ot.folio}}:\n\nCliente: {{cliente.razon_social}}\nVehículo: {{vehiculo.marca}} {{vehiculo.modelo}} - {{vehiculo.patente}}\nFecha: {{ot.fecha_programada}}\nHorario: {{ot.ventana_inicio}} - {{ot.ventana_fin}}\nDirección: {{ot.direccion}}\n\nNotas: {{ot.notas}}', 'work_order', 'Email al técnico cuando se asigna una OT', true, '["ot.folio", "ot.tecnico_nombre", "ot.fecha_programada", "cliente.razon_social", "vehiculo.marca", "vehiculo.modelo", "vehiculo.patente"]'::jsonb),
('wo_in_progress', 'email', 'OT {{ot.folio}} en progreso', 'El técnico {{ot.tecnico_nombre}} ha iniciado el trabajo en la OT {{ot.folio}}.', 'work_order', 'Notificación cuando inicia el trabajo', false, '["ot.folio", "ot.tecnico_nombre"]'::jsonb),
('wo_completed', 'email', 'OT {{ot.folio}} completada', 'Estimado/a {{cliente.razon_social}},\n\nLe informamos que la orden de trabajo {{ot.folio}} para su vehículo {{vehiculo.patente}} ha sido completada exitosamente.\n\nGracias por confiar en {{empresa.razon_social}}.', 'work_order', 'Email al cliente cuando se completa una OT', true, '["ot.folio", "cliente.razon_social", "vehiculo.patente", "empresa.razon_social"]'::jsonb),
('wo_cancelled', 'email', 'OT {{ot.folio}} cancelada', 'La orden de trabajo {{ot.folio}} ha sido cancelada.', 'work_order', 'Notificación cuando se cancela', false, '["ot.folio"]'::jsonb),
('wo_scheduled_reminder', 'email', 'Recordatorio: OT {{ot.folio}} programada para mañana', 'Hola {{ot.tecnico_nombre}},\n\nTe recordamos que tienes programada la OT {{ot.folio}} para mañana {{ot.fecha_programada}} a las {{ot.ventana_inicio}}.\n\nCliente: {{cliente.razon_social}}\nDirección: {{ot.direccion}}', 'work_order', 'Recordatorio al técnico el día anterior', true, '["ot.folio", "ot.tecnico_nombre", "ot.fecha_programada", "cliente.razon_social"]'::jsonb),
('wo_delayed', 'email', 'Alerta: OT {{ot.folio}} retrasada', 'La OT {{ot.folio}} asignada a {{ot.tecnico_nombre}} está retrasada.', 'work_order', 'Alerta cuando una OT se atrasa', false, '["ot.folio", "ot.tecnico_nombre"]'::jsonb)
ON CONFLICT (evento, canal) DO NOTHING;

-- 1.7 Insertar templates de Sistema
INSERT INTO notification_templates (evento, canal, asunto, cuerpo, categoria, descripcion, activa, variables_disponibles) VALUES
('user_invited', 'email', 'Invitación a {{empresa.razon_social}}', 'Has sido invitado a unirte al sistema de {{empresa.razon_social}}.\n\nPor favor completa tu registro para acceder.', 'system', 'Email de invitación a nuevos usuarios', true, '["empresa.razon_social"]'::jsonb),
('password_reset', 'email', 'Recuperación de contraseña', 'Has solicitado restablecer tu contraseña en {{empresa.razon_social}}.\n\nSigue el enlace para crear una nueva contraseña.', 'system', 'Email de recuperación de contraseña', true, '["empresa.razon_social"]'::jsonb),
('stock_alert', 'email', 'Alerta: Stock bajo', 'El producto ha alcanzado el nivel mínimo de stock en bodega.', 'system', 'Alerta de inventario bajo', true, '[]'::jsonb)
ON CONFLICT (evento, canal) DO NOTHING;

-- 1.8 Habilitar RLS en nuevas tablas
ALTER TABLE notification_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_conditions ENABLE ROW LEVEL SECURITY;

-- 1.9 Políticas RLS para notification_variables
CREATE POLICY "Admin: gestiona notification_variables"
ON notification_variables FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos ven notification_variables"
ON notification_variables FOR SELECT
TO authenticated
USING (true);

-- 1.10 Políticas RLS para notification_conditions
CREATE POLICY "Admin: gestiona notification_conditions"
ON notification_conditions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos ven notification_conditions"
ON notification_conditions FOR SELECT
TO authenticated
USING (true);