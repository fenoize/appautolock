-- ============================================
-- MIGRACIÓN: Módulo Clientes y Vehículos
-- ============================================

-- 1. STORAGE BUCKET PARA ADJUNTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS POLICIES PARA STORAGE
CREATE POLICY "Admin: total acceso a attachments"
ON storage.objects FOR ALL
USING (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendedor: ve attachments de sus clientes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND 
  public.has_role(auth.uid(), 'vendedor'::app_role) AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE vendedor_id = auth.uid()
  )
);

CREATE POLICY "Vendedor: sube attachments de sus clientes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND 
  public.has_role(auth.uid(), 'vendedor'::app_role) AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE vendedor_id = auth.uid()
  )
);

CREATE POLICY "Operador: total acceso attachments de su branch"
ON storage.objects FOR ALL
USING (
  bucket_id = 'attachments' AND 
  public.has_role(auth.uid(), 'operador'::app_role) AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM clients WHERE branch_id = public.get_user_branch(auth.uid())
  )
);

-- 3. CONSTRAINTS ADICIONALES
ALTER TABLE vehicles ADD CONSTRAINT vehicles_patente_unique UNIQUE (patente);

-- 4. TRIGGERS PARA CONTACTO PRINCIPAL ÚNICO
CREATE OR REPLACE FUNCTION validate_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_principal = true THEN
    UPDATE client_contacts 
    SET es_principal = false 
    WHERE client_id = NEW.client_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_contact
BEFORE INSERT OR UPDATE ON client_contacts
FOR EACH ROW
WHEN (NEW.es_principal = true)
EXECUTE FUNCTION validate_single_primary_contact();

-- 5. TRIGGERS PARA DIRECCIÓN PREDETERMINADA ÚNICA
CREATE OR REPLACE FUNCTION validate_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_predeterminada = true THEN
    UPDATE client_addresses 
    SET es_predeterminada = false 
    WHERE client_id = NEW.client_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address
BEFORE INSERT OR UPDATE ON client_addresses
FOR EACH ROW
WHEN (NEW.es_predeterminada = true)
EXECUTE FUNCTION validate_single_default_address();

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_vendedor ON clients(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clients_branch ON clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut) WHERE rut IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email_principal) WHERE email_principal IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_estado ON clients(estado);
CREATE INDEX IF NOT EXISTS idx_vehicles_patente ON vehicles(patente);
CREATE INDEX IF NOT EXISTS idx_vehicles_client ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_addresses_client ON client_addresses(client_id);

-- 7. FUNCIÓN DE BÚSQUEDA FULL-TEXT PARA CLIENTES
CREATE OR REPLACE FUNCTION search_clients(search_term text)
RETURNS TABLE (
  client_id uuid,
  relevance int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    (
      CASE WHEN c.razon_social ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END +
      CASE WHEN c.nombre_comercial ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END +
      CASE WHEN c.rut ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END +
      CASE WHEN c.email_principal ILIKE '%' || search_term || '%' THEN 1 ELSE 0 END +
      CASE WHEN search_term = ANY(c.telefonos) THEN 1 ELSE 0 END
    ) as relevance
  FROM clients c
  WHERE 
    c.razon_social ILIKE '%' || search_term || '%' OR
    c.nombre_comercial ILIKE '%' || search_term || '%' OR
    c.rut ILIKE '%' || search_term || '%' OR
    c.email_principal ILIKE '%' || search_term || '%' OR
    search_term = ANY(c.telefonos)
  ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. FUNCIÓN DE BÚSQUEDA PARA VEHÍCULOS
CREATE OR REPLACE FUNCTION search_vehicles(search_term text)
RETURNS TABLE (
  vehicle_id uuid,
  relevance int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    (
      CASE WHEN v.patente ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END +
      CASE WHEN v.vin ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END +
      CASE WHEN v.marca ILIKE '%' || search_term || '%' THEN 1 ELSE 0 END +
      CASE WHEN v.modelo ILIKE '%' || search_term || '%' THEN 1 ELSE 0 END
    ) as relevance
  FROM vehicles v
  WHERE 
    v.patente ILIKE '%' || search_term || '%' OR
    v.vin ILIKE '%' || search_term || '%' OR
    v.marca ILIKE '%' || search_term || '%' OR
    v.modelo ILIKE '%' || search_term || '%'
  ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. TRIGGER PARA AUDIT LOG DE CLIENTES
CREATE OR REPLACE FUNCTION audit_clients_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_nuevos)
    VALUES ('clients', NEW.id, 'INSERT', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores, datos_nuevos)
    VALUES ('clients', NEW.id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores)
    VALUES ('clients', OLD.id, 'DELETE', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clients_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_clients_changes();

-- 10. TRIGGER PARA AUDIT LOG DE VEHÍCULOS
CREATE OR REPLACE FUNCTION audit_vehicles_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_nuevos)
    VALUES ('vehicles', NEW.id, 'INSERT', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores, datos_nuevos)
    VALUES ('vehicles', NEW.id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, user_id, datos_anteriores)
    VALUES ('vehicles', OLD.id, 'DELETE', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER vehicles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON vehicles
FOR EACH ROW EXECUTE FUNCTION audit_vehicles_changes();

-- 11. RLS POLICY PARA ATTACHMENTS TABLE
CREATE POLICY "Admin: total acceso a attachments table"
ON attachments FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendedor: ve attachments de sus clientes"
ON attachments FOR SELECT
USING (
  public.has_role(auth.uid(), 'vendedor'::app_role) AND
  entidad = 'client' AND
  entidad_id IN (SELECT id FROM clients WHERE vendedor_id = auth.uid())
);

CREATE POLICY "Vendedor: crea attachments de sus clientes"
ON attachments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'vendedor'::app_role) AND
  entidad = 'client' AND
  entidad_id IN (SELECT id FROM clients WHERE vendedor_id = auth.uid()) AND
  uploaded_by = auth.uid()
);

CREATE POLICY "Operador: ve attachments de su branch"
ON attachments FOR SELECT
USING (
  public.has_role(auth.uid(), 'operador'::app_role) AND
  entidad = 'client' AND
  entidad_id IN (SELECT id FROM clients WHERE branch_id = public.get_user_branch(auth.uid()))
);

CREATE POLICY "Operador: crea attachments de su branch"
ON attachments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'operador'::app_role) AND
  entidad = 'client' AND
  entidad_id IN (SELECT id FROM clients WHERE branch_id = public.get_user_branch(auth.uid())) AND
  uploaded_by = auth.uid()
);