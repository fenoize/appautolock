import { useState, useEffect } from 'react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { supabase } from '@/integrations/supabase/client';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Calendar, AlertTriangle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { WOFilters } from '@/types/workOrders';
import { AssignTechnicianDialog } from '@/components/workOrders/AssignTechnicianDialog';

export default function WOList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<WOFilters>({});
  const { data: workOrders, isLoading } = useWorkOrders(filters);
  const [pendingGpsWoIds, setPendingGpsWoIds] = useState<Set<string>>(new Set());
  const [assignTarget, setAssignTarget] = useState<{ id: string; branchId: string } | null>(null);

  useEffect(() => {
    if (!workOrders || workOrders.length === 0) return;
    const completedIds = workOrders.filter(w => w.estado === 'completada').map(w => w.id);
    if (completedIds.length === 0) {
      setPendingGpsWoIds(new Set());
      return;
    }
    supabase
      .from('wo_subscription_items')
      .select('wo_id')
      .in('wo_id', completedIds)
      .is('subscription_id', null)
      .then(({ data }) => {
        setPendingGpsWoIds(new Set((data || []).map((r: any) => r.wo_id)));
      });
  }, [workOrders]);


  return (
    <PageContainer>
      <PageHeader
        title="Órdenes de Trabajo"
        description="Gestiona las órdenes de trabajo del sistema"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/work-orders/calendar')}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendario
            </Button>
            <Button onClick={() => navigate('/work-orders/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva OT
            </Button>
          </div>
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
                      {pendingGpsWoIds.has(wo.id) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </TooltipTrigger>
                            <TooltipContent>GPS sin configurar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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
                  <div className="text-right text-sm text-muted-foreground space-y-2">
                    {wo.tecnico && <p>Técnico: {wo.tecnico.nombre} {wo.tecnico.apellido}</p>}
                    {wo.branch && <p>Sucursal: {wo.branch.nombre}</p>}
                    {(wo.estado === 'pendiente' || wo.estado === 'asignada') && wo.branch_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignTarget({ id: wo.id, branchId: wo.branch_id! });
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {assignTarget && (
        <AssignTechnicianDialog
          open={!!assignTarget}
          onOpenChange={(open) => !open && setAssignTarget(null)}
          workOrderId={assignTarget.id}
          branchId={assignTarget.branchId}
        />
      )}
    </PageContainer>
  );
}
