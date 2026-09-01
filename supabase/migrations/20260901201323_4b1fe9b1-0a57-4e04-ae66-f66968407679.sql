select cron.schedule('actualizar-estado-suscripciones-daily', '10 8 * * *', $$select public.actualizar_estado_suscripciones();$$);
select public.actualizar_estado_suscripciones();