-- Agregar campos de geolocalización a work_orders
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS ubicacion_lat NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS ubicacion_lng NUMERIC(11, 8);

COMMENT ON COLUMN work_orders.ubicacion_lat IS 'Latitud de la ubicación de la OT';
COMMENT ON COLUMN work_orders.ubicacion_lng IS 'Longitud de la ubicación de la OT';

-- Insertar configuración SLA en settings
INSERT INTO settings (clave, valor, descripcion, tipo_dato)
VALUES ('sla_ot_minutos_objetivo', '120', 'Tiempo objetivo en minutos para completar una OT desde asignación', 'number')
ON CONFLICT (clave) DO NOTHING;