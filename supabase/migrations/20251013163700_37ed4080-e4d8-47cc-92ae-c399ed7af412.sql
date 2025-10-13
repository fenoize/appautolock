-- Agregar columnas para configuración de notificaciones en subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS 
  notificacion_config JSONB DEFAULT '{
    "recordatorios": [
      {"dias_previos": 30, "canal": "email", "activo": true},
      {"dias_previos": 7, "canal": "email", "activo": true}
    ],
    "incluir_datos_vehiculo": true,
    "incluir_datos_cliente": true,
    "campos_vehiculo": ["patente", "marca", "modelo", "anio"],
    "campos_cliente": ["razon_social", "email_principal", "telefonos"]
  }'::jsonb;

-- Agregar template personalizado por plan
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS 
  template_notificacion JSONB DEFAULT '{
    "asunto": "Recordatorio: Vencimiento de suscripción GPS",
    "cuerpo": "Estimado {{nombre_cliente}}, su suscripción GPS del plan {{plan_nombre}} vence en {{dias_restantes}} días el {{fecha_vencimiento}}.\n\nFolio: {{folio}}"
  }'::jsonb;