import { ClipboardList } from 'lucide-react';
import { WorkOrder } from '@/types/workOrders';
import { Separator } from '@/components/ui/separator';
import { WOStatusBadge } from './WOStatusBadge';

interface WOInvoiceHeaderProps {
  workOrder: WorkOrder;
}

export function WOInvoiceHeader({ workOrder }: WOInvoiceHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Logo y Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ORDEN DE TRABAJO</h1>
            <p className="text-sm text-muted-foreground">Work Order</p>
          </div>
        </div>
        <WOStatusBadge status={workOrder.estado} />
      </div>

      <Separator />

      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cliente */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Cliente / Customer</h3>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {workOrder.client?.nombre_comercial || workOrder.client?.razon_social}
            </p>
            {workOrder.client?.rut && (
              <p className="text-sm text-muted-foreground font-mono">
                RUT: {workOrder.client.rut}-{workOrder.client?.dv}
              </p>
            )}
            {workOrder.client?.email_principal && (
              <p className="text-sm text-muted-foreground">{workOrder.client.email_principal}</p>
            )}
          </div>
        </div>

        {/* Técnico */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Técnico / Technician</h3>
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

      {/* Vehículo */}
      {workOrder.vehicle && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Vehículo / Vehicle</h3>
          <p className="font-medium text-foreground">
            {workOrder.vehicle.marca} {workOrder.vehicle.modelo} - 
            <span className="font-mono ml-1">{workOrder.vehicle.patente}</span>
            {workOrder.vehicle.anio && ` (${workOrder.vehicle.anio})`}
          </p>
        </div>
      )}
    </div>
  );
}