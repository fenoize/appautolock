REVOKE EXECUTE ON FUNCTION public.activate_wo_subscriptions(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_wo_subscriptions(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_wo_subscriptions(UUID) TO service_role;