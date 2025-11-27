import { ClipboardList, Calendar, Clock, MapPin } from 'lucide-react';
import { WorkOrder } from '@/types/workOrders';
import { Separator } from '@/components/ui/separator';
import { WOStatusBadge } from './WOStatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WODetailHeaderProps {
  workOrder: WorkOrder;
}

export function WODetailHeader({ workOrder }: WODetailHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Título y Estado */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">OT {workOrder.folio}</h1>
              <WOStatusBadge status={workOrder.estado} />
            </div>
            <p className="text-sm text-muted-foreground">Orden de Trabajo</p>
          </div>
        </div>
        {workOrder.quote_id && (
          <Badge variant="outline">📋 Generada desde Cotización</Badge>
        )}
      </div>

      <Separator />

      {/* Información de Programación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
        {workOrder.fecha_programada && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Programada</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {format(new Date(workOrder.fecha_programada), "dd/MM/yyyy", { locale: es })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(workOrder.fecha_programada), "HH:mm", { locale: es })} hrs
              </p>
            </div>
          </div>
        )}

        {workOrder.ventana_inicio && workOrder.ventana_fin && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Ventana Horaria</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {workOrder.ventana_inicio} - {workOrder.ventana_fin}
              </p>
            </div>
          </div>
        )}

        {(workOrder.ubicacion_manual || workOrder.direccion_id || workOrder.direccion) && (
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dirección de Instalación</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {workOrder.direccion || workOrder.ubicacion_manual || 'Dirección del cliente'}
              </p>
              {workOrder.comuna && workOrder.region && (
                <p className="text-xs text-muted-foreground mt-1">
                  {workOrder.comuna}, {workOrder.region}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Cliente, Vehículo y Técnico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cliente */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Cliente</h3>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {workOrder.client?.nombre_comercial || workOrder.client?.razon_social}
            </p>
            {workOrder.client?.email_principal && (
              <p className="text-sm text-muted-foreground">{workOrder.client.email_principal}</p>
            )}
            {workOrder.client?.rut && (
              <p className="text-xs text-muted-foreground font-mono">
                {workOrder.client.rut}-{workOrder.client?.dv}
              </p>
            )}
          </div>
        </div>

        {/* Vehículo */}
        {workOrder.vehicle && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Vehículo</h3>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                {workOrder.vehicle.marca} {workOrder.vehicle.modelo}
              </p>
              <p className="text-sm font-mono text-foreground">{workOrder.vehicle.patente}</p>
              {workOrder.vehicle.anio && (
                <p className="text-xs text-muted-foreground">Año {workOrder.vehicle.anio}</p>
              )}
            </div>
          </div>
        )}

        {/* Técnico */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Técnico Asignado</h3>
          <div className="space-y-1">
            {workOrder.tecnico ? (
              <>
                <p className="font-semibold text-foreground">
                  {workOrder.tecnico.nombre} {workOrder.tecnico.apellido}
                </p>
                <p className="text-sm text-muted-foreground">{workOrder.tecnico.email}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin asignar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
