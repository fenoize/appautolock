REVOKE EXECUTE ON FUNCTION public.fn_auto_expire_quotes() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_auto_expire_quotes() TO service_role;