import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { useWorkOrders as useWorkOrdersRaw, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
const useWorkOrders = () => {
  const q = useWorkOrdersRaw({ pageSize: 500 });
  return { ...q, data: q.data?.data ?? [] };
};
import { useUsers } from '@/hooks/useUsers';
import { WOStatus, WorkOrder } from '@/types/workOrders';
import { Calendar, List, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { WOMobileCalendar } from '@/components/workOrders/WOMobileCalendar';

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
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<{ wo: WorkOrder; anchorEl?: { x: number; y: number } } | null>(null);
  const [editTecnicoId, setEditTecnicoId] = useState<string>('');
  const [editFecha, setEditFecha] = useState<string>('');
  const [editVentanaFin, setEditVentanaFin] = useState<string>('');
  const [editMotivo, setEditMotivo] = useState<string>('');
  const [pendingReschedule, setPendingReschedule] = useState<{
    wo: WorkOrder;
    oldDate: Date;
    newDate: Date;
    oldEnd?: Date;
    newEnd?: Date;
    kind: 'drop' | 'resize';
  } | null>(null);
  const [rescheduleMotivo, setRescheduleMotivo] = useState('');
  const [notifyTecnico, setNotifyTecnico] = useState(true);
  const [notifyCliente, setNotifyCliente] = useState(false);
  const [confirmingReschedule, setConfirmingReschedule] = useState(false);

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

  // Manejar drop de evento → confirmar antes de aplicar
  const handleEventDrop = (info: any) => {
    const wo: WorkOrder = info.event.extendedProps.wo;
    const oldDate = info.oldEvent.start as Date;
    const newDate = info.event.start as Date;
    const oldEnd = info.oldEvent.end as Date | undefined;
    const newEnd = info.event.end as Date | undefined;
    info.revert();
    setPendingReschedule({ wo, oldDate, newDate, oldEnd, newEnd, kind: 'drop' });
    setRescheduleMotivo('');
    setNotifyTecnico(!!wo.tecnico_id);
    setNotifyCliente(false);
  };

  // Manejar resize de evento (cambiar duración) → confirmar antes de aplicar
  const handleEventResize = (info: any) => {
    const wo: WorkOrder = info.event.extendedProps.wo;
    const oldDate = info.oldEvent.start as Date;
    const newDate = info.event.start as Date;
    const oldEnd = info.oldEvent.end as Date | undefined;
    const newEnd = info.event.end as Date | undefined;
    info.revert();
    setPendingReschedule({ wo, oldDate, newDate, oldEnd, newEnd, kind: 'resize' });
    setRescheduleMotivo('');
    setNotifyTecnico(!!wo.tecnico_id);
    setNotifyCliente(false);
  };

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const confirmReschedule = async () => {
    if (!pendingReschedule) return;
    if (rescheduleMotivo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres');
      return;
    }
    const { wo, newDate, newEnd } = pendingReschedule;
    setConfirmingReschedule(true);
    try {
      const motivo = rescheduleMotivo.trim();
      const notas = `${wo.notas ? wo.notas + '\n' : ''}[${new Date().toLocaleString()}] Reprogramada: ${motivo}`;
      await updateWorkOrder.mutateAsync({
        id: wo.id,
        fecha_programada: newDate.toISOString(),
        ventana_fin: newEnd ? newEnd.toISOString() : wo.ventana_fin,
        estado: 'reprogramada',
        notas,
      } as any);

      // Buscar email del técnico si corresponde
      const tecnico = technicians.find(t => t.id === wo.tecnico_id);

      const baseData = {
        ot: {
          folio: wo.folio,
          fecha_programada: formatDateTime(newDate),
          ventana_inicio: formatDateTime(newDate),
          ventana_fin: newEnd ? formatDateTime(newEnd) : '',
          motivo_reprogramacion: motivo,
        },
        cliente: wo.client,
        vehiculo: wo.vehicle,
        tecnico: tecnico ? { nombre: tecnico.nombre, apellido: tecnico.apellido, email: tecnico.email } : null,
        sistema: { empresa_nombre: 'Autolock', fecha_actual: new Date().toISOString() },
      };

      if (notifyTecnico && tecnico?.email) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: { evento: 'wo_rescheduled', data: baseData, recipient: tecnico.email },
          });
        } catch (e) {
          console.warn('No se pudo notificar al técnico', e);
        }
      }

      if (notifyCliente && wo.client?.email_principal) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: { evento: 'wo_client_rescheduled', data: baseData, recipient: wo.client.email_principal },
          });
        } catch (e) {
          console.warn('No se pudo notificar al cliente', e);
        }
      }

      toast.success('OT reprogramada');
      setPendingReschedule(null);
    } catch (e) {
      toast.error('Error al reprogramar la OT');
    } finally {
      setConfirmingReschedule(false);
    }
  };

  // Manejar click en evento → abrir panel de edición rápida
  const handleEventClick = (info: any) => {
    const wo: WorkOrder = info.event.extendedProps.wo;
    setSelectedEvent({ wo, anchorEl: { x: info.jsEvent.clientX, y: info.jsEvent.clientY } });
    setEditTecnicoId(wo.tecnico_id || 'unassigned');
    setEditFecha(wo.fecha_programada ? toLocalDatetime(wo.fecha_programada) : '');
    setEditVentanaFin(wo.ventana_fin ? toLocalDatetime(wo.ventana_fin) : '');
    setEditMotivo('');
  };

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const closeSheet = () => setSelectedEvent(null);

  const handleSaveQuickEdit = async () => {
    if (!selectedEvent) return;
    const { wo } = selectedEvent;
    const newTecnico = editTecnicoId === 'unassigned' ? null : editTecnicoId;
    const tecnicoChanged = (wo.tecnico_id || null) !== newTecnico;
    const fechaChanged = editFecha && (!wo.fecha_programada || toLocalDatetime(wo.fecha_programada) !== editFecha);
    const ventanaChanged = editVentanaFin !== (wo.ventana_fin ? toLocalDatetime(wo.ventana_fin) : '');

    if ((tecnicoChanged || fechaChanged || ventanaChanged) && !editMotivo.trim()) {
      toast.error('Indica el motivo del cambio');
      return;
    }

    try {
      const payload: any = { id: wo.id };
      if (tecnicoChanged) {
        payload.tecnico_id = newTecnico;
        if (!newTecnico && wo.estado === 'asignada') payload.estado = 'pendiente';
        if (newTecnico && wo.estado === 'pendiente') payload.estado = 'asignada';
      }
      if (fechaChanged) payload.fecha_programada = new Date(editFecha).toISOString();
      if (ventanaChanged) payload.ventana_fin = editVentanaFin ? new Date(editVentanaFin).toISOString() : null;
      if (editMotivo.trim()) {
        payload.notas = `${wo.notas ? wo.notas + '\n' : ''}[${new Date().toLocaleString()}] ${editMotivo.trim()}`;
      }
      await updateWorkOrder.mutateAsync(payload);
      toast.success('OT actualizada');
      closeSheet();
    } catch (e) {
      toast.error('Error al actualizar la OT');
    }
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
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        title="Calendario de OTs"
        description="Programa y asigna técnicos arrastrando las OTs"
      />

      {isMobile ? (
        <WOMobileCalendar workOrders={filteredWorkOrders} />
      ) : (
      <>


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
                {...(viewMode === 'timeline' && { resources })}
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
      </>
      )}


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

      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedEvent.wo.folio}
                  <WOStatusBadge status={selectedEvent.wo.estado} />
                </SheetTitle>
                <SheetDescription>Edición rápida de la orden de trabajo</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 py-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cliente</Label>
                  {selectedEvent.wo.client ? (
                    <Link
                      to={`/clients/${selectedEvent.wo.client_id}`}
                      className="text-sm font-medium text-primary hover:underline block"
                      onClick={closeSheet}
                    >
                      {selectedEvent.wo.client.razon_social || selectedEvent.wo.client.nombre_comercial}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin cliente</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Vehículo</Label>
                  <p className="text-sm">
                    {selectedEvent.wo.vehicle
                      ? `${selectedEvent.wo.vehicle.marca} ${selectedEvent.wo.vehicle.modelo} - ${selectedEvent.wo.vehicle.patente}`
                      : 'Sin vehículo'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Técnico asignado</Label>
                  <Select value={editTecnicoId} onValueChange={setEditTecnicoId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.nombre} {tech.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-fecha">Fecha y hora programada</Label>
                  <Input
                    id="quick-fecha"
                    type="datetime-local"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-ventana">Ventana fin (opcional)</Label>
                  <Input
                    id="quick-ventana"
                    type="datetime-local"
                    value={editVentanaFin}
                    onChange={(e) => setEditVentanaFin(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-motivo">
                    Motivo del cambio <span className="text-muted-foreground">(requerido si modificas técnico o fecha)</span>
                  </Label>
                  <Textarea
                    id="quick-motivo"
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value)}
                    placeholder="Ej: Reasignado por solicitud del cliente"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={handleSaveQuickEdit} disabled={updateWorkOrder.isPending}>
                    Guardar cambios
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate(`/work-orders/${selectedEvent.wo.id}`);
                      closeSheet();
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver detalle completo
                  </Button>
                  <Button variant="ghost" onClick={closeSheet}>
                    Cerrar sin guardar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!pendingReschedule} onOpenChange={(open) => !open && !confirmingReschedule && setPendingReschedule(null)}>
        <DialogContent className="sm:max-w-md">
          {pendingReschedule && (
            <>
              <DialogHeader>
                <DialogTitle>Reprogramar OT {pendingReschedule.wo.folio}</DialogTitle>
                <DialogDescription>
                  Confirma el cambio de {pendingReschedule.kind === 'resize' ? 'duración' : 'fecha'} de esta orden de trabajo.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fecha anterior</Label>
                  <p className="text-sm font-medium line-through opacity-70">
                    {formatDateTime(pendingReschedule.oldDate)}
                    {pendingReschedule.oldEnd && ` → ${formatDateTime(pendingReschedule.oldEnd)}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fecha nueva</Label>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatDateTime(pendingReschedule.newDate)}
                    {pendingReschedule.newEnd && ` → ${formatDateTime(pendingReschedule.newEnd)}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reschedule-motivo">
                    Motivo del cambio <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reschedule-motivo"
                    placeholder="Explica el motivo (mínimo 10 caracteres)"
                    value={rescheduleMotivo}
                    onChange={(e) => setRescheduleMotivo(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {rescheduleMotivo.trim().length}/10 caracteres mínimos
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notify-tec"
                      checked={notifyTecnico}
                      onCheckedChange={(c) => setNotifyTecnico(!!c)}
                      disabled={!pendingReschedule.wo.tecnico_id}
                    />
                    <Label htmlFor="notify-tec" className="text-sm font-normal cursor-pointer">
                      Notificar al técnico por email
                      {!pendingReschedule.wo.tecnico_id && (
                        <span className="text-xs text-muted-foreground ml-1">(sin técnico asignado)</span>
                      )}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notify-cli"
                      checked={notifyCliente}
                      onCheckedChange={(c) => setNotifyCliente(!!c)}
                      disabled={!pendingReschedule.wo.client?.email_principal}
                    />
                    <Label htmlFor="notify-cli" className="text-sm font-normal cursor-pointer">
                      Notificar al cliente por email
                      {!pendingReschedule.wo.client?.email_principal && (
                        <span className="text-xs text-muted-foreground ml-1">(sin email)</span>
                      )}
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPendingReschedule(null)} disabled={confirmingReschedule}>
                  Cancelar
                </Button>
                <Button onClick={confirmReschedule} disabled={confirmingReschedule || rescheduleMotivo.trim().length < 10}>
                  {confirmingReschedule ? 'Guardando...' : 'Confirmar reprogramación'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
