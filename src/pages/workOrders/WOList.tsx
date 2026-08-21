import { useState, useEffect, useMemo } from 'react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { supabase } from '@/integrations/supabase/client';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { WOTipoBadge } from '@/components/workOrders/WOTipoBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageContainer } from '@/components/shared/PageContainer';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Calendar, AlertTriangle, UserPlus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { WOFilters } from '@/types/workOrders';
import { AssignTechnicianDialog } from '@/components/workOrders/AssignTechnicianDialog';
import { WOMobileList } from '@/components/workOrders/WOMobileList';
import { useIsMobile } from '@/hooks/use-mobile';

const PAGE_SIZE = 25;
const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'asignada', label: 'Asignada' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'archivado', label: 'Archivado' },

];

export default function WOList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [searchInput, setSearchInput] = useState('');
  const [estado, setEstado] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, estado, dateFrom, dateTo]);

  const filters: WOFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    estado: (estado as any) || undefined,
    fecha_desde: dateFrom || undefined,
    fecha_hasta: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  }), [debouncedSearch, estado, dateFrom, dateTo, page]);

  const { data: result, isLoading, isFetching } = useWorkOrders(filters);
  const workOrders = result?.data ?? [];
  const totalPages = result?.totalPages ?? 1;
  const count = result?.count ?? 0;

  const [pendingGpsWoIds, setPendingGpsWoIds] = useState<Set<string>>(new Set());
  const [assignTarget, setAssignTarget] = useState<{ id: string; branchId: string } | null>(null);

  useEffect(() => {
    if (!workOrders || workOrders.length === 0) {
      setPendingGpsWoIds(new Set());
      return;
    }
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

  const clearFilters = () => {
    setSearchInput('');
    setEstado('');
    setDateFrom('');
    setDateTo('');
  };
  const hasFilters = !!(searchInput || estado || dateFrom || dateTo);

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gestiona las órdenes de trabajo del sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => navigate('/work-orders/calendar')} className="w-full sm:w-auto">
            <Calendar className="mr-2 h-4 w-4" />
            Calendario
          </Button>
          <Button onClick={() => navigate('/work-orders/new')} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nueva OT
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar folio, cliente, patente…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select value={estado || 'all'} onValueChange={(v) => setEstado(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS.map(e => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Desde"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Hasta"
            />
          </div>
          {hasFilters && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{count} resultado{count === 1 ? '' : 's'}</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando órdenes de trabajo...
        </div>
      ) : workOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontraron órdenes de trabajo</p>
          {!hasFilters && (
            <Button onClick={() => navigate('/work-orders/new')}>
              Crear primera OT
            </Button>
          )}
        </div>
      ) : isMobile ? (
        <WOMobileList
          workOrders={workOrders}
          pendingGpsWoIds={pendingGpsWoIds}
          onAssign={(id, branchId) => setAssignTarget({ id, branchId })}
        />
      ) : (
        <div className={`grid gap-4 ${isFetching ? 'opacity-70' : ''}`}>
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
                      <WOTipoBadge tipo={(wo as any).tipo} />
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

      {workOrders.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {count} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
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
