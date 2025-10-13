-- ============================================
-- FASE 4: SUSCRIPCIONES GPS
-- ============================================

-- 1. CREAR TABLA notification_templates
-- Plantillas editables para recordatorios
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  canal notification_channel NOT NULL,
  asunto TEXT,
  cuerpo TEXT NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evento, canal)
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: gestiona notification_templates"
ON notification_templates FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos ven templates activas"
ON notification_templates FOR SELECT
USING (activa = TRUE);

CREATE TRIGGER trigger_update_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. CREAR TABLA reminder_settings
-- Configuración de recordatorios
CREATE TABLE reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  dias_previos INTEGER NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  canal_preferido notification_channel DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evento)
);

ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: gestiona reminder_settings"
ON reminder_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos ven reminder_settings"
ON reminder_settings FOR SELECT
USING (TRUE);

CREATE TRIGGER trigger_update_reminder_settings_updated_at
BEFORE UPDATE ON reminder_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales de reminder_settings
INSERT INTO reminder_settings (evento, dias_previos, canal_preferido) VALUES
('recordatorio_30d', 30, 'email'),
('recordatorio_15d', 15, 'email'),
('recordatorio_7d', 7, 'whatsapp'),
('recordatorio_1d', 1, 'whatsapp');


-- 3. AGREGAR COLUMNAS A subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS ultima_notificacion_enviada TEXT,
ADD COLUMN IF NOT EXISTS fecha_ultima_notificacion TIMESTAMPTZ;


-- 4. FUNCIÓN: actualizar_estado_suscripciones()
CREATE OR REPLACE FUNCTION actualizar_estado_suscripciones()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_dias_vencidos INTEGER;
BEGIN
  FOR v_sub IN 
    SELECT s.*, sp.dias_gracia, sp.suspension_automatica
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.estado IN ('activa', 'mora')
  LOOP
    v_dias_vencidos := EXTRACT(DAY FROM (NOW() - v_sub.fecha_vencimiento::timestamptz));
    
    IF v_dias_vencidos > 0 THEN
      IF v_dias_vencidos <= v_sub.dias_gracia THEN
        IF v_sub.estado != 'mora' THEN
          UPDATE subscriptions SET estado = 'mora' WHERE id = v_sub.id;
          INSERT INTO subscription_events (subscription_id, tipo, notas)
          VALUES (v_sub.id, 'cambio_estado_mora', 'Suscripción entró en mora');
        END IF;
      ELSE
        IF v_sub.suspension_automatica AND v_sub.estado != 'suspendida' THEN
          UPDATE subscriptions SET estado = 'suspendida' WHERE id = v_sub.id;
          INSERT INTO subscription_events (subscription_id, tipo, notas)
          VALUES (v_sub.id, 'suspension_automatica', 'Suscripción suspendida por falta de pago');
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;


-- 5. FUNCIÓN: renovar_suscripcion()
CREATE OR REPLACE FUNCTION renovar_suscripcion(p_subscription_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_nueva_fecha_vencimiento DATE;
BEGIN
  SELECT s.*, sp.periodo_meses
  INTO v_sub
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suscripción no encontrada';
  END IF;
  
  IF v_sub.estado IN ('activa', 'mora') THEN
    v_nueva_fecha_vencimiento := v_sub.fecha_vencimiento + INTERVAL '1 month' * v_sub.periodo_meses;
  ELSE
    v_nueva_fecha_vencimiento := CURRENT_DATE + INTERVAL '1 month' * v_sub.periodo_meses;
  END IF;
  
  UPDATE subscriptions
  SET 
    fecha_vencimiento = v_nueva_fecha_vencimiento,
    estado = 'activa',
    ultima_notificacion_enviada = NULL,
    fecha_ultima_notificacion = NULL
  WHERE id = p_subscription_id;
  
  INSERT INTO subscription_events (subscription_id, tipo, notas, user_id)
  VALUES (p_subscription_id, 'renovacion', 'Suscripción renovada hasta ' || v_nueva_fecha_vencimiento, auth.uid());
END;
$$;


-- 6. FUNCIÓN: pausar_suscripcion()
CREATE OR REPLACE FUNCTION pausar_suscripcion(p_subscription_id UUID, p_notas TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET estado = 'suspendida', notas = COALESCE(p_notas, notas)
  WHERE id = p_subscription_id;
  
  INSERT INTO subscription_events (subscription_id, tipo, notas, user_id)
  VALUES (p_subscription_id, 'pausa', p_notas, auth.uid());
END;
$$;


-- 7. FUNCIÓN: reactivar_suscripcion()
CREATE OR REPLACE FUNCTION reactivar_suscripcion(p_subscription_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dias_vencidos INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - fecha_vencimiento::timestamptz))
  INTO v_dias_vencidos
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  IF v_dias_vencidos > 0 THEN
    RAISE EXCEPTION 'Suscripción vencida. Debe renovarse antes de reactivar.';
  END IF;
  
  UPDATE subscriptions
  SET estado = 'activa'
  WHERE id = p_subscription_id;
  
  INSERT INTO subscription_events (subscription_id, tipo, notas, user_id)
  VALUES (p_subscription_id, 'reactivacion', 'Suscripción reactivada', auth.uid());
END;
$$;


-- 8. FUNCIÓN: cancelar_suscripcion()
CREATE OR REPLACE FUNCTION cancelar_suscripcion(p_subscription_id UUID, p_notas TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET estado = 'cancelada', notas = COALESCE(p_notas, notas)
  WHERE id = p_subscription_id;
  
  INSERT INTO subscription_events (subscription_id, tipo, notas, user_id)
  VALUES (p_subscription_id, 'cancelacion', p_notas, auth.uid());
END;
$$;


-- 9. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscriptions_estado ON subscriptions(estado);
CREATE INDEX IF NOT EXISTS idx_subscriptions_fecha_vencimiento ON subscriptions(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_tipo ON subscription_events(tipo);


-- 10. DATOS INICIALES: Plantillas de Notificaciones
INSERT INTO notification_templates (evento, canal, asunto, cuerpo) VALUES
('recordatorio_30d', 'email', 
 'Recordatorio: Tu suscripción GPS vence en 30 días',
 'Hola {{nombre_cliente}},

Tu suscripción GPS con folio {{folio}} vencerá el {{fecha_vencimiento}} (en {{dias_restantes}} días).

Plan: {{plan_nombre}}

Para renovar, contacta a tu ejecutivo de ventas.

Saludos,
Equipo GPS'),

('recordatorio_15d', 'email',
 'Recordatorio: Tu suscripción GPS vence en 15 días',
 'Hola {{nombre_cliente}},

Tu suscripción GPS con folio {{folio}} vencerá el {{fecha_vencimiento}} (en {{dias_restantes}} días).

Te recordamos renovar a tiempo para evitar interrupciones en el servicio.

Saludos,
Equipo GPS'),

('recordatorio_7d', 'whatsapp',
 '',
 '🚨 *Recordatorio Urgente*
Hola {{nombre_cliente}}, tu suscripción GPS ({{folio}}) vence en *{{dias_restantes}} días* ({{fecha_vencimiento}}). Renueva ahora para evitar suspensión.'),

('recordatorio_1d', 'whatsapp',
 '',
 '⚠️ *Último Aviso*
Hola {{nombre_cliente}}, tu suscripción GPS ({{folio}}) vence *MAÑANA* ({{fecha_vencimiento}}). Renueva urgente.'),

('vencimiento', 'email',
 'Tu suscripción GPS ha vencido',
 'Hola {{nombre_cliente}},

Tu suscripción GPS con folio {{folio}} ha vencido el {{fecha_vencimiento}}.

Actualmente estás en período de gracia. Renueva pronto para evitar suspensión del servicio.

Saludos,
Equipo GPS'),

('suspension', 'email',
 'Tu suscripción GPS ha sido suspendida',
 'Hola {{nombre_cliente}},

Tu suscripción GPS con folio {{folio}} ha sido suspendida por falta de pago.

Para reactivarla, contacta a tu ejecutivo de ventas.

Saludos,
Equipo GPS');


-- 11. DATOS INICIALES: Planes de Ejemplo
INSERT INTO subscription_plans (nombre, descripcion, precio, periodo_meses, dias_gracia, suspension_automatica) VALUES
('GPS Básico Mensual', 'Plan mensual con seguimiento en tiempo real', 15000, 1, 5, TRUE),
('GPS Básico Anual', 'Plan anual con 2 meses gratis', 150000, 12, 15, TRUE),
('GPS Premium Mensual', 'Plan mensual con alertas avanzadas y reportes', 25000, 1, 5, TRUE),
('GPS Premium Anual', 'Plan anual premium con 2 meses gratis', 250000, 12, 15, TRUE);