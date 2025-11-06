import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWorkOrders, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { useUsers } from '@/hooks/useUsers';
import { WOStatus } from '@/types/workOrders';
import { Calendar, List } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<WOStatus, string> = {
  pendiente: '#94a3b8',
  asignada: '#3b82f6',
  programada: '#8b5cf6',
  en_ruta: '#f59e0b',
  en_proceso: '#10b981',
  pausada: '#f97316',
  reprogramada: '#ec4899',
  completada: '#22c55e',
  cancelada: '#ef4444',
};

export default function WOCalendar() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');

  const { data: workOrders, isLoading } = useWorkOrders();
  const { data: users } = useUsers();
  const updateWorkOrder = useUpdateWorkOrder();

  // Filtrar solo técnicos
  const technicians = useMemo(() => {
    return users?.filter(user => 
      user.roles?.some(r => r === 'tecnico')
    ) || [];
  }, [users]);

  // Filtrar OTs según filtros aplicados
  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    
    return workOrders.filter(wo => {
      if (selectedBranch !== 'all' && wo.branch_id !== selectedBranch) return false;
      if (selectedTechnician !== 'all' && wo.tecnico_id !== selectedTechnician) return false;
      return true;
    });
  }, [workOrders, selectedBranch, selectedTechnician]);

  // Convertir OTs a eventos de calendario
  const events = useMemo(() => {
    return filteredWorkOrders
      .filter(wo => wo.fecha_programada) // Solo OTs programadas
      .map(wo => {
        const start = new Date(wo.fecha_programada!);
        const end = new Date(wo.ventana_fin || wo.fecha_programada!);
        
        return {
          id: wo.id,
          title: `${wo.folio} - ${wo.client?.razon_social || wo.client?.nombre_comercial || 'Sin cliente'}`,
          start,
          end,
          resourceId: wo.tecnico_id || 'unassigned',
          backgroundColor: statusColors[wo.estado],
          borderColor: statusColors[wo.estado],
          extendedProps: {
            wo,
            vehicle: wo.vehicle ? `${wo.vehicle.marca} ${wo.vehicle.modelo} - ${wo.vehicle.patente}` : 'Sin vehículo',
            estado: wo.estado,
            folio: wo.folio,
          }
        };
      });
  }, [filteredWorkOrders]);

  // Recursos (técnicos) para la vista timeline
  const resources = useMemo(() => {
    const technicianResources = technicians.map(tech => ({
      id: tech.id,
      title: `${tech.nombre} ${tech.apellido || ''}`.trim(),
    }));

    return [
      { id: 'unassigned', title: 'Sin asignar' },
      ...technicianResources,
    ];
  }, [technicians]);

  // Obtener sucursales únicas
  const branches = useMemo(() => {
    if (!workOrders) return [];
    const branchMap = new Map();
    workOrders.forEach(wo => {
      if (wo.branch && !branchMap.has(wo.branch.id)) {
        branchMap.set(wo.branch.id, wo.branch);
      }
    });
    return Array.from(branchMap.values());
  }, [workOrders]);

  // Manejar drop de evento (reprogramar o reasignar)
  const handleEventDrop = async (info: any) => {
    const woId = info.event.id;
    const newStart = info.event.start;
    const newResourceId = info.event.getResources()[0]?.id;

    try {
      await updateWorkOrder.mutateAsync({
        id: woId,
        fecha_programada: newStart.toISOString(),
        tecnico_id: newResourceId === 'unassigned' ? null : newResourceId,
        estado: newResourceId && newResourceId !== 'unassigned' ? 'asignada' : 'pendiente',
      });
      
      toast.success('Orden de trabajo actualizada');
    } catch (error) {
      toast.error('Error al actualizar OT');
      info.revert();
    }
  };

  // Manejar resize de evento (cambiar duración)
  const handleEventResize = async (info: any) => {
    const woId = info.event.id;
    const newEnd = info.event.end;

    try {
      await updateWorkOrder.mutateAsync({
        id: woId,
        ventana_fin: newEnd.toISOString(),
      });
      
      toast.success('Duración actualizada');
    } catch (error) {
      toast.error('Error al actualizar duración');
      info.revert();
    }
  };

  // Manejar click en evento
  const handleEventClick = (info: any) => {
    const woId = info.event.id;
    navigate(`/work-orders/${woId}`);
  };

  // Renderizar contenido del evento
  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-semibold truncate">{eventInfo.event.extendedProps.folio}</div>
        <div className="truncate">{eventInfo.event.title.split(' - ')[1]}</div>
        {eventInfo.event.extendedProps.vehicle && (
          <div className="text-[10px] opacity-75 truncate">{eventInfo.event.extendedProps.vehicle}</div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Calendario de Órdenes de Trabajo"
        description="Programa y asigna técnicos arrastrando las OTs"
      />

      {/* Filtros y controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Vista */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendario
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <List className="h-4 w-4 mr-2" />
                Timeline
              </Button>
            </div>

            {/* Filtro Sucursal */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sucursal:</span>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Técnico */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Técnico:</span>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.nombre} {tech.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leyenda de estados */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Estados:</span>
              {Object.entries(statusColors).slice(0, 5).map(([status, color]) => (
                <Badge
                  key={status}
                  variant="outline"
                  style={{ borderColor: color, color }}
                  className="text-xs"
                >
                  {status.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">Cargando calendario...</p>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendar
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  resourceTimelinePlugin,
                ]}
                initialView={viewMode === 'calendar' ? 'timeGridWeek' : 'resourceTimelineDay'}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: viewMode === 'calendar' 
                    ? 'dayGridMonth,timeGridWeek,timeGridDay'
                    : 'resourceTimelineDay,resourceTimelineWeek',
                }}
                locale="es"
                height="auto"
                events={events}
                resources={viewMode === 'timeline' ? resources : undefined}
                editable={true}
                droppable={true}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                nowIndicator={true}
                weekends={true}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5, 6],
                  startTime: '08:00',
                  endTime: '18:00',
                }}
                slotDuration="00:30:00"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .calendar-container .fc {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent) / 0.1);
        }
        
        .calendar-container .fc-theme-standard td,
        .calendar-container .fc-theme-standard th {
          border-color: hsl(var(--border));
        }
        
        .calendar-container .fc-col-header-cell {
          background-color: hsl(var(--muted));
        }
        
        .calendar-container .fc-timegrid-slot {
          height: 3rem;
        }
        
        .calendar-container .fc-event {
          cursor: pointer;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .calendar-container .fc-event:hover {
          opacity: 0.9;
        }
        
        .calendar-container .fc-daygrid-event {
          white-space: normal;
        }
        
        .calendar-container .fc-toolbar-title {
          color: hsl(var(--foreground));
        }
        
        .calendar-container .fc-col-header-cell-cushion,
        .calendar-container .fc-daygrid-day-number,
        .calendar-container .fc-timegrid-slot-label {
          color: hsl(var(--foreground));
        }
        
        .calendar-container .fc-resource-timeline-divider {
          background-color: hsl(var(--border));
        }
        
        .calendar-container .fc-timeline-slot {
          border-color: hsl(var(--border));
        }
        
        .calendar-container .fc-timeline-event {
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
