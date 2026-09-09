INSERT INTO public.subscription_renewals (subscription_id, renewed_at, fecha_anterior, fecha_nueva, renovado_por)
SELECT DISTINCT ON (x.subscription_id, x.fecha_nueva)
  x.subscription_id,
  x.fecha,
  (x.fecha_nueva - (x.periodo_meses || ' months')::interval)::date,
  x.fecha_nueva,
  x.user_id
FROM (
  SELECT e.subscription_id,
         e.fecha,
         e.user_id,
         COALESCE(p.periodo_meses, 12) AS periodo_meses,
         (substring(e.notas from '(\d{4}-\d{2}-\d{2})'))::date AS fecha_nueva
  FROM public.subscription_events e
  JOIN public.subscriptions s ON s.id = e.subscription_id
  LEFT JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE e.tipo IN ('renovacion', 'pago_recibido')
    AND e.notas ~ '\d{4}-\d{2}-\d{2}'
) x
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_renewals r
  WHERE r.subscription_id = x.subscription_id
    AND r.fecha_nueva = x.fecha_nueva
)
ORDER BY x.subscription_id, x.fecha_nueva, x.fecha ASC;