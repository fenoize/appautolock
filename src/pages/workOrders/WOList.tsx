import { useState } from 'react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { WOFilters } from '@/types/workOrders';

export default function WOList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WOFilters>({});
  const { data: workOrders, isLoading } = useWorkOrders(filters);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <Button onClick={() => navigate('/work-orders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva OT
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio o notas..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Cargando...</div>
      ) : (
        <div className="grid gap-4">
          {workOrders?.map((wo) => (
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
    </div>
  );
}
