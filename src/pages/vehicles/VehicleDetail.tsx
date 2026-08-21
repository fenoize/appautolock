import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useVehicle } from '@/hooks/useVehicles';
import { VehicleServiceHistory } from '@/components/vehicles/VehicleServiceHistory';
import { VehicleProductCompatibility } from '@/components/vehicles/VehicleProductCompatibility';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText } from 'lucide-react';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id!);

  const { data: installedDevices } = useQuery({
    queryKey: ['vehicle-installed-devices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wo_items')
        .select(`
          id,
          nombre,
          serial_instalado,
          serial_verificado,
          work_orders!inner(vehicle_id, folio, fecha_programada, estado),
          products(nombre, sku)
        `)
        .eq('work_orders.vehicle_id', id)
        .eq('serial_verificado', true)
        .not('serial_instalado', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-muted-foreground">Cargando vehículo...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Vehículo no encontrado</p>
          <Button onClick={() => navigate('/vehicles')}>
            Volver a Vehículos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => navigate(`/vehicles/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">
              {vehicle.patente}
            </CardTitle>
            <p className="text-xl text-foreground">
              {vehicle.marca} {vehicle.modelo} {vehicle.anio}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Propietario */}
            {vehicle.clients && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Propietario</p>
                <p
                  className="font-semibold text-lg cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/clients/${vehicle.client_id}`)}
                >
                  {(vehicle.clients as any).razon_social || (vehicle.clients as any).nombre_comercial}
                </p>
                {(vehicle.clients as any).email_principal && (
                  <p className="text-sm text-muted-foreground">
                    {(vehicle.clients as any).email_principal}
                  </p>
                )}
              </div>
            )}

            {/* Detalles del Vehículo */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {vehicle.vin && (
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium">{vehicle.vin}</p>
                </div>
              )}
              {vehicle.combustible && (
                <div>
                  <p className="text-sm text-muted-foreground">Combustible</p>
                  <p className="font-medium">{vehicle.combustible}</p>
                </div>
              )}
              {vehicle.tipo_encendido && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de encendido</p>
                  <p className="font-medium inline-flex items-center gap-1">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    {vehicle.tipo_encendido}
                  </p>
                </div>
              )}
              {vehicle.color && (
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium">{vehicle.color}</p>
                </div>
              )}
              {vehicle.odometro !== null && vehicle.odometro !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Odómetro</p>
                  <p className="font-medium">{vehicle.odometro.toLocaleString()} km</p>
                </div>
              )}
              {vehicle.numero_motor && (
                <div>
                  <p className="text-sm text-muted-foreground">Número de Motor</p>
                  <p className="font-medium">{vehicle.numero_motor}</p>
                </div>
              )}
            </div>

            {/* Notas */}
            {vehicle.notas && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notas</p>
                <p className="text-sm">{vehicle.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Historial de Servicios</TabsTrigger>
            <TabsTrigger value="devices">
              Dispositivos Instalados
              {installedDevices && installedDevices.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {installedDevices.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compatibility">Compatibilidad</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <VehicleServiceHistory vehicleId={id!} />
          </TabsContent>

          <TabsContent value="devices" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos Instalados</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {installedDevices && installedDevices.length > 0
                    ? `${installedDevices.length} dispositivo${installedDevices.length === 1 ? '' : 's'} instalado${installedDevices.length === 1 ? '' : 's'}`
                    : 'Equipos y productos instalados en este vehículo'}
                </p>
              </CardHeader>
              <CardContent>
                {!installedDevices || installedDevices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay dispositivos instalados en este vehículo
                  </p>
                ) : (
                  <div className="space-y-3">
                    {installedDevices.map((device: any) => {
                      const wo = device.work_orders as any;
                      const product = device.products as any;
                      return (
                        <div
                          key={device.id}
                          onClick={() => navigate(`/work-orders/${wo?.id}`)}
                          className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">
                                {device.nombre || product?.nombre || 'Dispositivo'}
                              </span>
                            </div>
                            {wo?.estado && <WOStatusBadge status={wo.estado} />}
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="font-mono">
                              {device.serial_instalado}
                            </Badge>
                            {product?.sku && (
                              <span className="text-muted-foreground">SKU: {product.sku}</span>
                            )}
                          </div>

                          {wo?.folio && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>OT de origen: {wo.folio}</span>
                            </div>
                          )}

                          {wo?.fecha_programada && (
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(wo.fecha_programada), "d 'de' MMMM 'de' yyyy", { locale: es })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compatibility" className="mt-4">
            <VehicleProductCompatibility
              vehicle={{ marca: vehicle.marca, modelo: vehicle.modelo, anio: vehicle.anio }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
