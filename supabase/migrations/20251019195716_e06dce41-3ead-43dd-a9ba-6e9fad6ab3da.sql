-- Habilitar extensión pg_cron para tareas programadas
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Función para verificar y procesar notificaciones pendientes
CREATE OR REPLACE FUNCTION check_pending_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      
      -- Insertar en cola de notificaciones
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
          'plan', jsonb_build_object(
            'nombre', v_record.plan_nombre
          ),
          'sistema', jsonb_build_object(
            'dias_restantes', v_dias_restantes,
            'fecha_actual', CURRENT_DATE
          )
        ),
        'pendiente'
      );
      
      -- Marcar notificación enviada
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
      CASE 
        WHEN v_dias_restantes <= 1 THEN 'quote_reminder_1d'
        ELSE 'quote_reminder_3d'
      END,
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
        'sistema', jsonb_build_object(
          'fecha_actual', CURRENT_DATE
        )
      ),
      'pendiente'
    );
  END LOOP;
  
  RAISE NOTICE 'Notification check completed';
END;
$$;

-- Programar ejecución diaria a las 8 AM
SELECT cron.schedule(
  'check-notifications-daily',
  '0 8 * * *',
  $$ SELECT check_pending_notifications(); $$
);