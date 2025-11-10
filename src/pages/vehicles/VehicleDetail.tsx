import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVehicle } from '@/hooks/useVehicles';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id!);

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

        {/* Historial de Servicios */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              No hay órdenes de trabajo registradas para este vehículo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
