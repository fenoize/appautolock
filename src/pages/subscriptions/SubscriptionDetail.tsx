import { useParams } from 'react-router-dom';
import { useSubscription, useRenewSubscription, usePauseSubscription, useReactivateSubscription, useCancelSubscription } from '@/hooks/useSubscriptions';
import { SubscriptionStatusBadge } from '@/components/subscriptions/SubscriptionStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RefreshCw, Pause, Play, X } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: subscription, isLoading } = useSubscription(id!);
  const renewMutation = useRenewSubscription();
  const pauseMutation = usePauseSubscription();
  const reactivateMutation = useReactivateSubscription();
  const cancelMutation = useCancelSubscription();

  if (isLoading) return <div>Cargando...</div>;
  if (!subscription) return <div>Suscripción no encontrada</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{subscription.folio}</h1>
          <div className="mt-2">
            <SubscriptionStatusBadge status={subscription.estado} />
          </div>
        </div>
        <div className="flex gap-2">
          {(subscription.estado === 'activa' || subscription.estado === 'mora') && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renovar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Renovación</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Deseas renovar esta suscripción? Se extenderá por {subscription.plan?.periodo_meses} mes(es).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => renewMutation.mutate(subscription.id)}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={() => pauseMutation.mutate({ id: subscription.id })}>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            </>
          )}

          {subscription.estado === 'suspendida' && (
            <Button onClick={() => reactivateMutation.mutate(subscription.id)}>
              <Play className="h-4 w-4 mr-2" />
              Reactivar
            </Button>
          )}

          {subscription.estado !== 'cancelada' && (
            <Button variant="destructive" onClick={() => cancelMutation.mutate({ id: subscription.id })}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="timeline">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{subscription.client?.razon_social || subscription.client?.nombre_comercial}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{subscription.vehicle?.patente || 'Sin vehículo asignado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{subscription.plan?.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="font-medium">${subscription.plan?.precio.toLocaleString('es-CL')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fechas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Inicio</p>
                  <p className="font-medium">{format(new Date(subscription.fecha_inicio), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimiento</p>
                  <p className="font-medium">{format(new Date(subscription.fecha_vencimiento), 'dd/MM/yyyy')}</p>
                </div>
                {subscription.notas && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="font-medium">{subscription.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Eventos</CardTitle>
              <CardDescription>Registro de cambios y acciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscription.events?.map((event) => (
                  <div key={event.id} className="flex gap-4 border-l-2 border-border pl-4 py-2">
                    <div className="flex-1">
                      <p className="font-medium capitalize">{event.tipo.replace('_', ' ')}</p>
                      {event.notas && <p className="text-sm text-muted-foreground">{event.notas}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.fecha), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
