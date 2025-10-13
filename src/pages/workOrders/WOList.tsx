import { useState } from 'react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { WOFilters } from '@/types/workOrders';

export default function WOList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WOFilters>({});
  const { data: workOrders, isLoading } = useWorkOrders(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Órdenes de Trabajo"
        description="Gestiona las órdenes de trabajo del sistema"
        action={
          <Button onClick={() => navigate('/work-orders/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva OT
          </Button>
        }
      />

      <SearchBar
        value={filters.search || ''}
        onChange={(value) => setFilters({ ...filters, search: value })}
        placeholder="Buscar por folio o notas..."
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando órdenes de trabajo...
        </div>
      ) : !workOrders || workOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontraron órdenes de trabajo</p>
          <Button onClick={() => navigate('/work-orders/new')}>
            Crear primera OT
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workOrders.map((wo) => (
            <Card 
              key={wo.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/work-orders/${wo.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{wo.folio}</h3>
                      <WOStatusBadge status={wo.estado} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {wo.client?.razon_social || wo.client?.nombre_comercial}
                    </p>
                    {wo.vehicle && (
                      <p className="text-sm text-muted-foreground">
                        Vehículo: {wo.vehicle.marca} {wo.vehicle.modelo} - {wo.vehicle.patente}
                      </p>
                    )}
                    {wo.fecha_programada && (
                      <p className="text-sm">
                        Programada: {format(new Date(wo.fecha_programada), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {wo.tecnico && <p>Técnico: {wo.tecnico.nombre} {wo.tecnico.apellido}</p>}
                    {wo.branch && <p>Sucursal: {wo.branch.nombre}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
