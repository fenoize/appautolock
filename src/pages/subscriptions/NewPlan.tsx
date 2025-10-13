import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  precio: z.number().min(0, 'Precio debe ser mayor a 0'),
  periodo_meses: z.number().min(1, 'Período debe ser al menos 1 mes'),
  dias_gracia: z.number().min(0, 'Días de gracia no puede ser negativo')
});

type FormValues = z.infer<typeof formSchema>;

export default function NewPlan() {
  const navigate = useNavigate();
  const createMutation = useCreateSubscriptionPlan();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      periodo_meses: 1,
      dias_gracia: 0
    }
  });

  const onSubmit = async (values: FormValues) => {
    const newPlan = await createMutation.mutateAsync({
      ...values,
      activo: true,
      suspension_automatica: false,
      notificacion_config: {
        recordatorios: [
          { dias_previos: 30, canal: 'email' as const, activo: true },
          { dias_previos: 7, canal: 'email' as const, activo: true }
        ],
        incluir_datos_vehiculo: true,
        incluir_datos_cliente: true,
        campos_vehiculo: ['patente', 'marca', 'modelo', 'anio'],
        campos_cliente: ['razon_social', 'email_principal', 'telefonos']
      },
      template_notificacion: {
        asunto: 'Recordatorio: Vencimiento de suscripción GPS',
        cuerpo: 'Estimado {{nombre_cliente}}, su suscripción GPS del plan {{plan_nombre}} vence en {{dias_restantes}} días el {{fecha_vencimiento}}.\n\nFolio: {{folio}}'
      }
    } as any);
    
    navigate(`/subscriptions/plans/${newPlan.id}`);
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Nuevo Plan GPS"
        description="Crea un nuevo plan de suscripción"
        backButton={true}
        backTo="/subscriptions/plans"
      />
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Plan</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Plan Mensual GPS" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Describe las características del plan..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="precio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio (CLP)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          placeholder="15000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodo_meses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período (meses)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          placeholder="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dias_gracia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de Gracia</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Podrás configurar notificaciones después de crear el plan
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Plan'}
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => navigate('/subscriptions/plans')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
