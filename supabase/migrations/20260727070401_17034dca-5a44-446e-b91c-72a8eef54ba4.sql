INSERT INTO public.notification_templates (evento, canal, asunto, cuerpo, activa, categoria, descripcion)
VALUES ('subscription_expiring_reminder', 'email', '{{subject}}', '{{body}}', true, 'suscripciones', 'Recordatorio manual de vencimiento de suscripción GPS')
ON CONFLICT DO NOTHING;