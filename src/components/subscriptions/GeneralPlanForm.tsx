import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SubscriptionPlan } from '@/types/subscriptions';
import { useUpdateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  precio: z.number().min(0, 'Precio debe ser mayor a 0'),
  periodo_meses: z.number().min(1, 'Período debe ser al menos 1 mes'),
  dias_gracia: z.number().min(0, 'Días de gracia no puede ser negativo'),
  suspension_automatica: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

interface GeneralPlanFormProps {
  plan: SubscriptionPlan;
}

export function GeneralPlanForm({ plan }: GeneralPlanFormProps) {
  const updateMutation = useUpdateSubscriptionPlan();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      precio: plan.precio,
      periodo_meses: plan.periodo_meses,
      dias_gracia: plan.dias_gracia,
      suspension_automatica: plan.suspension_automatica
    }
  });

  const onSubmit = async (values: FormValues) => {
    await updateMutation.mutateAsync({ id: plan.id, ...values });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Plan</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} rows={3} />
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
                    <FormLabel>Precio Mensual (CLP)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suspension_automatica"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 pt-8">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <Label>Suspensión Automática</Label>
                  </FormItem>
                )}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Los días de gracia definen cuánto tiempo después del vencimiento 
                se mantendrá activa la suscripción antes de suspenderla.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
