import { useState } from 'react';
import { SubscriptionPlan, PlanNotificationConfig } from '@/types/subscriptions';
import { useUpdatePlanNotificationConfig } from '@/hooks/useSubscriptionPlans';
import { generateNotificationPreview } from '@/lib/notification-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface NotificationDataFormProps {
  plan: SubscriptionPlan;
}

export function NotificationDataForm({ plan }: NotificationDataFormProps) {
  const [dataConfig, setDataConfig] = useState<PlanNotificationConfig>(
    plan.notificacion_config || {
      recordatorios: [],
      incluir_datos_vehiculo: true,
      incluir_datos_cliente: true,
      campos_vehiculo: ['patente', 'marca', 'modelo', 'anio'],
      campos_cliente: ['razon_social', 'email_principal', 'telefonos']
    }
  );

  const updateMutation = useUpdatePlanNotificationConfig();

  const updateDataConfig = (field: string, value: any) => {
    setDataConfig({ ...dataConfig, [field]: value });
  };

  const toggleCampoVehiculo = (campo: string, checked: boolean) => {
    if (checked) {
      setDataConfig({
        ...dataConfig,
        campos_vehiculo: [...dataConfig.campos_vehiculo, campo]
      });
    } else {
      setDataConfig({
        ...dataConfig,
        campos_vehiculo: dataConfig.campos_vehiculo.filter(c => c !== campo)
      });
    }
  };

  const toggleCampoCliente = (campo: string, checked: boolean) => {
    if (checked) {
      setDataConfig({
        ...dataConfig,
        campos_cliente: [...dataConfig.campos_cliente, campo]
      });
    } else {
      setDataConfig({
        ...dataConfig,
        campos_cliente: dataConfig.campos_cliente.filter(c => c !== campo)
      });
    }
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      notificacion_config: dataConfig,
      template_notificacion: plan.template_notificacion
    });
  };

  const sampleData = {
    cliente: {
      razon_social: 'Empresa Demo S.A.',
      email_principal: 'contacto@empresa.cl',
      telefonos: '+56912345678'
    },
    vehiculo: {
      patente: 'ABCD12',
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2023
    },
    suscripcion: {
      folio: 'SUB-2025-0001',
      plan_nombre: plan.nombre,
      fecha_vencimiento: '2025-12-31'
    }
  };

  const preview = generateNotificationPreview(
    plan.template_notificacion,
    dataConfig,
    sampleData
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos en Notificaciones</CardTitle>
        <CardDescription>
          Selecciona qué información se incluirá en las notificaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Incluir datos del vehículo</Label>
            <p className="text-sm text-muted-foreground">
              Añade información del vehículo en las notificaciones
            </p>
          </div>
          <Switch
            checked={dataConfig.incluir_datos_vehiculo}
            onCheckedChange={(checked) => updateDataConfig('incluir_datos_vehiculo', checked)}
          />
        </div>
        
        {dataConfig.incluir_datos_vehiculo && (
          <Card className="p-4">
            <Label className="mb-3 block">Campos del vehículo a incluir:</Label>
            <div className="grid grid-cols-2 gap-3">
              {['patente', 'marca', 'modelo', 'anio', 'vin', 'color', 'combustible'].map((campo) => (
                <div key={campo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vehiculo_${campo}`}
                    checked={dataConfig.campos_vehiculo.includes(campo)}
                    onCheckedChange={(checked) => toggleCampoVehiculo(campo, checked as boolean)}
                  />
                  <Label htmlFor={`vehiculo_${campo}`} className="capitalize cursor-pointer">
                    {campo.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Incluir datos del cliente</Label>
            <p className="text-sm text-muted-foreground">
              Añade información del cliente en las notificaciones
            </p>
          </div>
          <Switch
            checked={dataConfig.incluir_datos_cliente}
            onCheckedChange={(checked) => updateDataConfig('incluir_datos_cliente', checked)}
          />
        </div>
        
        {dataConfig.incluir_datos_cliente && (
          <Card className="p-4">
            <Label className="mb-3 block">Campos del cliente a incluir:</Label>
            <div className="grid grid-cols-2 gap-3">
              {['razon_social', 'nombre_comercial', 'rut', 'email_principal', 'telefonos', 'giro'].map((campo) => (
                <div key={campo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cliente_${campo}`}
                    checked={dataConfig.campos_cliente.includes(campo)}
                    onCheckedChange={(checked) => toggleCampoCliente(campo, checked as boolean)}
                  />
                  <Label htmlFor={`cliente_${campo}`} className="capitalize cursor-pointer">
                    {campo.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        <Separator />
        
        <div>
          <Label className="mb-3 block">Vista Previa del Mensaje</Label>
          <Card className="p-4 bg-muted">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {preview}
            </pre>
          </Card>
        </div>
        
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </CardContent>
    </Card>
  );
}
