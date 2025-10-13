import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchBar } from '@/components/shared/SearchBar';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { VehiclesTable } from '@/components/vehicles/VehiclesTable';
import { useVehicles } from '@/hooks/useVehicles';

export default function VehiclesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('vehiclesViewMode') as 'grid' | 'table') || 'grid';
  });
  
  const { data: vehicles, isLoading } = useVehicles({ search });

  const handleViewChange = (view: 'grid' | 'table') => {
    setViewMode(view);
    localStorage.setItem('vehiclesViewMode', view);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Vehículos"
        description="Gestiona el parque vehicular"
        action={
          <div className="flex gap-2">
            <ViewToggle view={viewMode} onViewChange={handleViewChange} />
            <Button onClick={() => navigate('/vehicles/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Vehículo
            </Button>
          </div>
        }
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por patente, VIN, marca o modelo..."
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando vehículos...
        </div>
      ) : !vehicles || vehicles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontraron vehículos</p>
          <Button onClick={() => navigate('/vehicles/new')}>
            Registrar primer vehículo
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle: any) => (
            <Card
              key={vehicle.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-xl text-primary">
                      {vehicle.patente}
                    </h3>
                    <p className="text-lg font-medium text-foreground">
                      {vehicle.marca} {vehicle.modelo}
                    </p>
                    {vehicle.anio && (
                      <p className="text-sm text-muted-foreground">
                        Año {vehicle.anio}
                      </p>
                    )}
                  </div>

                  {vehicle.clients && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Propietario</p>
                      <p className="text-sm font-medium">
                        {vehicle.clients.razon_social || vehicle.clients.nombre_comercial}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 text-sm">
                    {vehicle.combustible && (
                      <div>
                        <p className="text-muted-foreground">Combustible</p>
                        <p className="font-medium">{vehicle.combustible}</p>
                      </div>
                    )}
                    {vehicle.odometro && (
                      <div>
                        <p className="text-muted-foreground">Odómetro</p>
                        <p className="font-medium">{vehicle.odometro.toLocaleString()} km</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <VehiclesTable vehicles={vehicles} />
      )}
    </PageContainer>
  );
}
