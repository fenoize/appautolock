REVOKE ALL ON FUNCTION public.activate_wo_subscriptions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_wo_subscriptions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.activate_wo_subscriptions(uuid) TO authenticated, service_role;