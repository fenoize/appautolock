import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCreateSubscription } from '@/hooks/useSubscriptions';
import { useClients } from '@/hooks/useClients';
import { useVehicles } from '@/hooks/useVehicles';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FormData {
  client_id: string;
  vehicle_id?: string;
  plan_id: string;
  fecha_inicio: string;
  notas?: string;
}

export default function NewSubscription() {
  const navigate = useNavigate();
  const form = useForm<FormData>({
    defaultValues: {
      fecha_inicio: new Date().toISOString().split('T')[0]
    }
  });

  const { data: clients } = useClients();
  const { data: vehicles } = useVehicles();
  const { data: plans } = useSubscriptionPlans();
  const createMutation = useCreateSubscription();

  const selectedClientId = form.watch('client_id');
  const clientVehicles = vehicles?.filter(v => v.client_id === selectedClientId);

  const onSubmit = async (data: FormData) => {
    const selectedPlan = plans?.find(p => p.id === data.plan_id);
    if (!selectedPlan) return;

    const fecha_inicio = new Date(data.fecha_inicio);
    const fecha_vencimiento = new Date(fecha_inicio);
    fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + selectedPlan.periodo_meses);

    await createMutation.mutateAsync({
      ...data,
      fecha_vencimiento: fecha_vencimiento.toISOString().split('T')[0]
    });

    navigate('/subscriptions');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Suscripción GPS</h1>
        <p className="text-muted-foreground">Crear una nueva suscripción de rastreo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Suscripción</CardTitle>
          <CardDescription>Complete la información requerida</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="client_id"
                rules={{ required: 'Cliente es requerido' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.razon_social || client.nombre_comercial}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedClientId && (
                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehículo (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar vehículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientVehicles?.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.patente} - {vehicle.marca} {vehicle.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="plan_id"
                rules={{ required: 'Plan es requerido' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.nombre} - ${plan.precio.toLocaleString('es-CL')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_inicio"
                rules={{ required: 'Fecha de inicio es requerida' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Notas adicionales..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Suscripción'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/subscriptions')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
