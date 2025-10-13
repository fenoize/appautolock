import { PlanNotificationTemplate, PlanNotificationConfig } from '@/types/subscriptions';

interface SampleData {
  cliente: any;
  vehiculo: any;
  suscripcion: any;
}

export function generateNotificationPreview(
  template: PlanNotificationTemplate,
  dataConfig: PlanNotificationConfig,
  sampleData: SampleData
): string {
  let preview = template.cuerpo;
  
  // Reemplazar variables de suscripción
  preview = preview.replace(/\{\{folio\}\}/g, sampleData.suscripcion.folio || 'SUB-2025-0001');
  preview = preview.replace(/\{\{plan_nombre\}\}/g, sampleData.suscripcion.plan_nombre || 'Plan Mensual GPS');
  preview = preview.replace(/\{\{fecha_vencimiento\}\}/g, sampleData.suscripcion.fecha_vencimiento || '2025-12-31');
  preview = preview.replace(/\{\{dias_restantes\}\}/g, '15');
  
  // Si se incluyen datos de cliente
  if (dataConfig.incluir_datos_cliente) {
    preview = preview.replace(/\{\{nombre_cliente\}\}/g, sampleData.cliente.razon_social || 'Empresa Demo');
    dataConfig.campos_cliente.forEach(campo => {
      const value = sampleData.cliente[campo];
      preview = preview.replace(
        new RegExp(`\\{\\{${campo}\\}\\}`, 'g'), 
        value || '-'
      );
    });
    
    preview += "\n\n--- Datos del Cliente ---\n";
    dataConfig.campos_cliente.forEach(campo => {
      const value = sampleData.cliente[campo];
      preview += `${campo.replace('_', ' ')}: ${value || '-'}\n`;
    });
  }
  
  // Si se incluyen datos de vehículo
  if (dataConfig.incluir_datos_vehiculo) {
    dataConfig.campos_vehiculo.forEach(campo => {
      const value = sampleData.vehiculo[campo];
      preview = preview.replace(
        new RegExp(`\\{\\{${campo}\\}\\}`, 'g'), 
        value || '-'
      );
    });
    
    preview += "\n\n--- Datos del Vehículo ---\n";
    dataConfig.campos_vehiculo.forEach(campo => {
      const value = sampleData.vehiculo[campo];
      preview += `${campo.charAt(0).toUpperCase() + campo.slice(1)}: ${value || '-'}\n`;
    });
  }
  
  return preview;
}
