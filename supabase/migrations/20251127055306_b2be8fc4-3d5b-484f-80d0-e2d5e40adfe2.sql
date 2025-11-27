-- Agregar campos de dirección a work_orders
ALTER TABLE work_orders 
ADD COLUMN direccion TEXT,
ADD COLUMN comuna TEXT,
ADD COLUMN region TEXT;

-- Comentario explicativo
COMMENT ON COLUMN work_orders.direccion IS 'Dirección de instalación (puede ser diferente a la del cliente)';
COMMENT ON COLUMN work_orders.comuna IS 'Comuna de instalación';
COMMENT ON COLUMN work_orders.region IS 'Región de instalación';