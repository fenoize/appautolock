import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSubscription, usePauseSubscription, useReactivateSubscription, useCancelSubscription } from '@/hooks/useSubscriptions';
import { SubscriptionStatusBadge } from '@/components/subscriptions/SubscriptionStatusBadge';
import { RenewalActionModal } from '@/components/subscriptions/RenewalActionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Pause, Play, X, Cpu, Smartphone, User, Settings } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: subscription, isLoading } = useSubscription(id!);
  const pauseMutation = usePauseSubscription();
  const reactivateMutation = useReactivateSubscription();
  const cancelMutation = useCancelSubscription();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalModalMode, setRenewalModalMode] = useState<'reactivar' | 'renovar'>('reactivar');

  if (isLoading) return <div>Cargando...</div>;
  if (!subscription) return <div>Suscripción no encontrada</div>;

  const isExpired = new Date(subscription.fecha_vencimiento) < new Date();
  const handleReactivateClick = () => {
    if (isExpired) {
      setRenewalModalMode('reactivar');
      setShowRenewalModal(true);
    } else {
      reactivateMutation.mutate(subscription.id);
    }
  };

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
              <Button onClick={() => { setRenewalModalMode('renovar'); setShowRenewalModal(true); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renovar
              </Button>

              <Button variant="outline" onClick={() => pauseMutation.mutate({ id: subscription.id })}>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            </>
          )}

          {subscription.estado === 'suspendida' && (
            <Button onClick={handleReactivateClick}>
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
          <TabsTrigger value="gps">Datos GPS</TabsTrigger>
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

        <TabsContent value="gps">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Datos del Equipo GPS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Equipo GPS
                </CardTitle>
                <CardDescription>Información técnica del dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Modelo del GPS</p>
                  <p className="font-medium">{subscription.modelo_gps || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IMEI GPS</p>
                  <p className="font-medium font-mono">{subscription.imei_gps || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Datos del PCS/Chip */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Chip / PCS
                </CardTitle>
                <CardDescription>Información del chip de datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">IMEI PCS</p>
                  <p className="font-medium font-mono">{subscription.imei_pcs || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número PCS</p>
                  <p className="font-medium">{subscription.numero_pcs || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compañía</p>
                  <p className="font-medium">{subscription.compania || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Datos de Acceso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Acceso de Usuario
                </CardTitle>
                <CardDescription>Credenciales y plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Correo Usuario</p>
                  <p className="font-medium">{subscription.correo_usuario || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">App Alojada</p>
                  <p className="font-medium">{subscription.app_alojada || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Datos del Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Servicio
                </CardTitle>
                <CardDescription>Responsable de instalación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Instalador</p>
                  <p className="font-medium">{subscription.instalador || '-'}</p>
                </div>
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

      <RenewalActionModal
        open={showRenewalModal}
        onOpenChange={setShowRenewalModal}
        mode={renewalModalMode}
        subscription={subscription as any}
      />
    </div>
  );
}