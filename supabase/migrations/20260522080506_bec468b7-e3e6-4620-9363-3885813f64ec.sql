-- 1) Template (idempotent)
INSERT INTO public.notification_templates (evento, canal, asunto, cuerpo, categoria, descripcion, activa)
SELECT
  'wo_client_reminder',
  'email'::notification_channel,
  'Recordatorio: Tu instalación está programada para mañana',
  E'Hola {{cliente.razon_social}},\n\nTe recordamos que tienes una instalación programada para mañana.\n\n📅 Fecha: {{ot.fecha_programada}}\n⏰ Horario: {{ot.ventana_inicio}} – {{ot.ventana_fin}}\n📍 Dirección: {{ot.direccion}}\n👤 Técnico: {{tecnico.nombre}}\n\nPor favor asegúrate de tener tu vehículo disponible en ese horario.\n\nSi necesitas reagendar, contáctanos respondiendo este correo o al teléfono de nuestra sucursal.\n\nGracias por confiar en nosotros.',
  'work_order',
  'Recordatorio al cliente el día anterior a la instalación',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_templates
  WHERE evento = 'wo_client_reminder' AND canal = 'email'::notification_channel
);

-- 2) Control column to avoid duplicates
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS cliente_recordatorio_enviado BOOLEAN DEFAULT FALSE;

-- 3) Update notifier function
CREATE OR REPLACE FUNCTION public.check_pending_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_record RECORD;
  v_reminder RECORD;
  v_dias_restantes INTEGER;
BEGIN
  -- ========================================
  -- SUSCRIPCIONES POR VENCER
  -- ========================================
  FOR v_reminder IN
    SELECT * FROM reminder_settings
    WHERE evento LIKE 'recordatorio_%' AND activo = true
  LOOP
    FOR v_record IN
      SELECT
        s.*,
        c.email_principal,
        c.razon_social as nombre_cliente,
        sp.nombre as plan_nombre,
        v.patente,
        v.marca,
        v.modelo,
        v.anio
      FROM subscriptions s
      JOIN clients c ON c.id = s.client_id
      JOIN subscription_plans sp ON sp.id = s.plan_id
      LEFT JOIN vehicles v ON v.id = s.vehicle_id
      WHERE s.estado = 'activa'
        AND s.fecha_vencimiento = CURRENT_DATE + v_reminder.dias_previos
        AND (
          s.ultima_notificacion_enviada IS NULL
          OR s.ultima_notificacion_enviada != v_reminder.evento
        )
    LOOP
      v_dias_restantes := v_reminder.dias_previos;

      INSERT INTO notifications (evento, destinatario, canal, payload, estado)
      VALUES (
        v_reminder.evento,
        v_record.email_principal,
        v_reminder.canal_preferido,
        jsonb_build_object(
          'suscripcion', jsonb_build_object(
            'folio', v_record.folio,
            'fecha_vencimiento', v_record.fecha_vencimiento,
            'fecha_inicio', v_record.fecha_inicio
          ),
          'cliente', jsonb_build_object(
            'razon_social', v_record.razon_social,
            'nombre_comercial', v_record.nombre_cliente,
            'email_principal', v_record.email_principal
          ),
          'vehiculo', jsonb_build_object(
            'patente', v_record.patente,
            'marca', v_record.marca,
            'modelo', v_record.modelo,
            'anio', v_record.anio
          ),
          'plan', jsonb_build_object('nombre', v_record.plan_nombre),
          'sistema', jsonb_build_object(
            'dias_restantes', v_dias_restantes,
            'fecha_actual', CURRENT_DATE
          )
        ),
        'pendiente'
      );

      UPDATE subscriptions
      SET
        ultima_notificacion_enviada = v_reminder.evento,
        fecha_ultima_notificacion = NOW()
      WHERE id = v_record.id;
    END LOOP;
  END LOOP;

  -- ========================================
  -- COTIZACIONES POR VENCER (3 días y 1 día)
  -- ========================================
  FOR v_record IN
    SELECT
      q.*,
      c.email_principal,
      c.razon_social as nombre_cliente,
      v.patente,
      v.marca,
      v.modelo,
      EXTRACT(DAY FROM (q.fecha_emision + q.validez_dias * INTERVAL '1 day') - CURRENT_DATE) as dias_restantes
    FROM quotes q
    JOIN clients c ON c.id = q.client_id
    LEFT JOIN vehicles v ON v.id = q.vehicle_id
    WHERE q.estado = 'enviada'
      AND (
        (q.fecha_emision + q.validez_dias * INTERVAL '1 day')::DATE = CURRENT_DATE + 3
        OR (q.fecha_emision + q.validez_dias * INTERVAL '1 day')::DATE = CURRENT_DATE + 1
      )
  LOOP
    v_dias_restantes := v_record.dias_restantes;

    INSERT INTO notifications (evento, destinatario, canal, payload, estado)
    VALUES (
      CASE WHEN v_dias_restantes <= 1 THEN 'quote_reminder_1d' ELSE 'quote_reminder_3d' END,
      v_record.email_principal,
      'email',
      jsonb_build_object(
        'cotizacion', jsonb_build_object(
          'folio', v_record.folio,
          'total', v_record.total,
          'neto', v_record.neto,
          'iva', v_record.iva,
          'fecha_emision', v_record.fecha_emision,
          'validez_dias', v_record.validez_dias
        ),
        'cliente', jsonb_build_object(
          'razon_social', v_record.razon_social,
          'email_principal', v_record.email_principal
        ),
        'vehiculo', jsonb_build_object(
          'patente', v_record.patente,
          'marca', v_record.marca,
          'modelo', v_record.modelo
        ),
        'sistema', jsonb_build_object(
          'dias_restantes', v_dias_restantes,
          'fecha_actual', CURRENT_DATE
        )
      ),
      'pendiente'
    );
  END LOOP;

  -- ========================================
  -- OT PROGRAMADAS PARA MAÑANA
  -- ========================================
  FOR v_record IN
    SELECT
      wo.*,
      p.email,
      p.nombre || ' ' || COALESCE(p.apellido, '') as nombre_tecnico,
      c.razon_social as nombre_cliente,
      c.email_principal as cliente_email,
      v.patente,
      v.marca,
      v.modelo
    FROM work_orders wo
    JOIN profiles p ON p.id = wo.tecnico_id
    JOIN clients c ON c.id = wo.client_id
    LEFT JOIN vehicles v ON v.id = wo.vehicle_id
    WHERE wo.fecha_programada::DATE = CURRENT_DATE + 1
      AND wo.estado IN ('programada', 'asignada')
  LOOP
    -- Notificar al técnico
    INSERT INTO notifications (evento, destinatario, canal, payload, estado)
    VALUES (
      'wo_scheduled_reminder',
      v_record.email,
      'email',
      jsonb_build_object(
        'ot', jsonb_build_object(
          'folio', v_record.folio,
          'fecha_programada', v_record.fecha_programada,
          'ventana_inicio', v_record.ventana_inicio,
          'ventana_fin', v_record.ventana_fin,
          'notas', v_record.notas
        ),
        'cliente', jsonb_build_object(
          'razon_social', v_record.nombre_cliente,
          'email_principal', v_record.cliente_email
        ),
        'vehiculo', jsonb_build_object(
          'patente', v_record.patente,
          'marca', v_record.marca,
          'modelo', v_record.modelo
        ),
        'tecnico', jsonb_build_object(
          'nombre', v_record.nombre_tecnico,
          'email', v_record.email
        ),
        'sistema', jsonb_build_object('fecha_actual', CURRENT_DATE)
      ),
      'pendiente'
    );

    -- Notificar al cliente (una sola vez)
    IF v_record.cliente_email IS NOT NULL AND COALESCE(v_record.cliente_recordatorio_enviado, FALSE) = FALSE THEN
      INSERT INTO notifications (evento, destinatario, canal, payload, estado)
      VALUES (
        'wo_client_reminder',
        v_record.cliente_email,
        'email',
        jsonb_build_object(
          'ot', jsonb_build_object(
            'folio', v_record.folio,
            'fecha_programada', to_char(v_record.fecha_programada::date, 'DD/MM/YYYY'),
            'ventana_inicio', v_record.ventana_inicio,
            'ventana_fin', v_record.ventana_fin,
            'direccion', v_record.direccion
          ),
          'cliente', jsonb_build_object('razon_social', v_record.nombre_cliente),
          'tecnico', jsonb_build_object('nombre', v_record.nombre_tecnico),
          'sistema', jsonb_build_object('fecha_actual', CURRENT_DATE)
        ),
        'pendiente'
      );

      UPDATE work_orders SET cliente_recordatorio_enviado = TRUE WHERE id = v_record.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Notification check completed';
END;
$function$;