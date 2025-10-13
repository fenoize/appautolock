-- Corregir search_path en funciones para seguridad

ALTER FUNCTION validate_single_primary_contact() SET search_path = public;
ALTER FUNCTION validate_single_default_address() SET search_path = public;
ALTER FUNCTION search_clients(text) SET search_path = public;
ALTER FUNCTION search_vehicles(text) SET search_path = public;
ALTER FUNCTION audit_clients_changes() SET search_path = public;
ALTER FUNCTION audit_vehicles_changes() SET search_path = public;