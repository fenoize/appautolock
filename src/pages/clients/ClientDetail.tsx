import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClient } from '@/hooks/useClients';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { ClientStatusBadge } from '@/components/clients/ClientStatusBadge';
import { formatRUT } from '@/lib/rut-validation';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id!);
  const { data: vehicles } = useVehiclesByClient(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-muted-foreground">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Cliente no encontrado</p>
          <Button onClick={() => navigate('/clients')}>
            Volver a Clientes
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
            onClick={() => navigate('/clients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {client.tipo === 'empresa' 
                    ? client.razon_social 
                    : client.nombre_comercial}
                </CardTitle>
                {client.rut && client.dv && (
                  <p className="text-muted-foreground mt-1">
                    RUT: {formatRUT(client.rut, client.dv)}
                  </p>
                )}
              </div>
              <ClientStatusBadge status={client.estado} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email_principal && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email_principal}</p>
                </div>
              )}
              {client.telefonos && client.telefonos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{client.telefonos[0]}</p>
                </div>
              )}
              {client.tipo === 'empresa' && client.giro && (
                <div>
                  <p className="text-sm text-muted-foreground">Giro</p>
                  <p className="font-medium">{client.giro}</p>
                </div>
              )}
            </div>
            {client.notas && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{client.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList>
            <TabsTrigger value="vehicles">Vehículos</TabsTrigger>
            <TabsTrigger value="contacts">Contactos</TabsTrigger>
            <TabsTrigger value="addresses">Direcciones</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Vehículos del Cliente</h3>
              <Button onClick={() => navigate(`/vehicles/new?client=${id}`)}>
                Agregar Vehículo
              </Button>
            </div>
            
            {!vehicles || vehicles.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No hay vehículos registrados
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {vehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{vehicle.patente}</p>
                          <p className="text-muted-foreground">
                            {vehicle.marca} {vehicle.modelo} {vehicle.anio}
                          </p>
                        </div>
                        {vehicle.odometro && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Odómetro</p>
                            <p className="font-medium">{vehicle.odometro.toLocaleString()} km</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Módulo de contactos en desarrollo
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Módulo de direcciones en desarrollo
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Historial de cambios en desarrollo
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
