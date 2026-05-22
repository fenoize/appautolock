INSERT INTO public.notification_templates (evento, canal, asunto, cuerpo, categoria, activa)
SELECT 'wo_rescheduled', 'email'::notification_channel,
  'Tu OT {{ot.folio}} ha sido reprogramada',
  E'Hola {{tecnico.nombre}},\n\nLa OT {{ot.folio}} ha sido reprogramada.\nNueva fecha: {{ot.fecha_programada}}\nMotivo: {{ot.motivo_reprogramacion}}\nCliente: {{cliente.razon_social}}',
  'work_order', true
WHERE NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE evento = 'wo_rescheduled' AND canal = 'email'::notification_channel);

INSERT INTO public.notification_templates (evento, canal, asunto, cuerpo, categoria, activa)
SELECT 'wo_client_rescheduled', 'email'::notification_channel,
  'Tu instalación ha sido reprogramada',
  E'Hola {{cliente.razon_social}},\n\nTu instalación programada ha sido reprogramada para el {{ot.fecha_programada}} a las {{ot.ventana_inicio}}.\nMotivo: {{ot.motivo_reprogramacion}}',
  'work_order', true
WHERE NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE evento = 'wo_client_rescheduled' AND canal = 'email'::notification_channel);