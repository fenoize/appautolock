import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchBar } from '@/components/shared/SearchBar';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { VehiclesTable } from '@/components/vehicles/VehiclesTable';
import { VehiclesMobileList } from '@/components/vehicles/VehiclesMobileList';
import { useVehicles } from '@/hooks/useVehicles';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { getStaggerStyle } from '@/lib/animations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IGNITION_TYPES } from '@/types/vehicles';

export default function VehiclesList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [tipoEncendido, setTipoEncendido] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    return (localStorage.getItem('vehiclesViewMode') as 'grid' | 'table') || 'table';
  });

  const { data: vehicles, isLoading } = useVehicles({
    search,
    tipo_encendido: tipoEncendido !== 'all' ? tipoEncendido : undefined,
  });

  const handleViewChange = (view: 'grid' | 'table') => {
    setViewMode(view);
    localStorage.setItem('vehiclesViewMode', view);
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Vehículos</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gestiona el parque vehicular
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          {!isMobile && <ViewToggle view={viewMode} onViewChange={handleViewChange} />}
          <Button onClick={() => navigate('/vehicles/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por patente, VIN, marca o modelo..."
          className="w-full sm:flex-1 sm:max-w-xl"
        />
        <Select value={tipoEncendido} onValueChange={setTipoEncendido}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tipo de encendido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los encendidos</SelectItem>
            {IGNITION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !vehicles || vehicles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontraron vehículos</p>
          <Button onClick={() => navigate('/vehicles/new')}>
            Registrar primer vehículo
          </Button>
        </div>
      ) : isMobile ? (
        <VehiclesMobileList vehicles={vehicles as any} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle: any, index: number) => (
            <Card
              key={vehicle.id}
              style={getStaggerStyle(index)}
              className={cn(
                'cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2',
                'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
              )}
              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-xl text-primary">{vehicle.patente}</h3>
                    <p className="text-lg font-medium text-foreground">
                      {vehicle.marca} {vehicle.modelo}
                    </p>
                    {vehicle.anio && (
                      <p className="text-sm text-muted-foreground">Año {vehicle.anio}</p>
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
