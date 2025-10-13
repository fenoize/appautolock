import { useState } from 'react';
import { SubscriptionPlan, NotificationReminderConfig, PlanNotificationTemplate } from '@/types/subscriptions';
import { useUpdatePlanNotificationConfig } from '@/hooks/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Info } from 'lucide-react';

interface NotificationConfigFormProps {
  plan: SubscriptionPlan;
}

export function NotificationConfigForm({ plan }: NotificationConfigFormProps) {
  const [recordatorios, setRecordatorios] = useState<NotificationReminderConfig[]>(
    plan.notificacion_config?.recordatorios || []
  );
  const [template, setTemplate] = useState<PlanNotificationTemplate>(
    plan.template_notificacion || { asunto: '', cuerpo: '' }
  );

  const updateMutation = useUpdatePlanNotificationConfig();

  const addRecordatorio = () => {
    setRecordatorios([...recordatorios, { dias_previos: 7, canal: 'email', activo: true }]);
  };

  const removeRecordatorio = (index: number) => {
    setRecordatorios(recordatorios.filter((_, i) => i !== index));
  };

  const updateRecordatorio = (index: number, field: string, value: any) => {
    const updated = [...recordatorios];
    updated[index] = { ...updated[index], [field]: value };
    setRecordatorios(updated);
  };

  const updateTemplate = (field: 'asunto' | 'cuerpo', value: string) => {
    setTemplate({ ...template, [field]: value });
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: plan.id,
      notificacion_config: {
        ...plan.notificacion_config,
        recordatorios
      },
      template_notificacion: template
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Recordatorios</CardTitle>
        <CardDescription>
          Define cuándo y cómo se notificará a los clientes sobre el vencimiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recordatorios.map((recordatorio, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label>Días antes del vencimiento</Label>
                <Input
                  type="number"
                  value={recordatorio.dias_previos}
                  onChange={(e) => updateRecordatorio(index, 'dias_previos', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label>Canal de notificación</Label>
                <Select
                  value={recordatorio.canal}
                  onValueChange={(value) => updateRecordatorio(index, 'canal', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={recordatorio.activo}
                  onCheckedChange={(checked) => updateRecordatorio(index, 'activo', checked)}
                />
                <Label>Activo</Label>
              </div>
              
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeRecordatorio(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        
        <Button onClick={addRecordatorio} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Recordatorio
        </Button>
        
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Plantilla de Mensaje</h3>
          
          <div>
            <Label>Asunto (Email)</Label>
            <Input
              value={template.asunto}
              onChange={(e) => updateTemplate('asunto', e.target.value)}
              placeholder="Recordatorio: Vencimiento de suscripción GPS"
            />
          </div>
          
          <div>
            <Label>Cuerpo del Mensaje</Label>
            <Textarea
              value={template.cuerpo}
              onChange={(e) => updateTemplate('cuerpo', e.target.value)}
              rows={6}
              placeholder="Estimado {{nombre_cliente}}..."
            />
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Variables disponibles:</strong><br/>
              • Cliente: {`{{nombre_cliente}}, {{email_cliente}}, {{telefono_cliente}}`}<br/>
              • Vehículo: {`{{patente}}, {{marca}}, {{modelo}}, {{anio}}`}<br/>
              • Suscripción: {`{{folio}}, {{plan_nombre}}, {{fecha_vencimiento}}, {{dias_restantes}}`}
            </AlertDescription>
          </Alert>
        </div>
        
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </CardContent>
    </Card>
  );
}
