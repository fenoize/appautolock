import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MoreVertical, Eye, Edit, User, Car, Calendar as CalIcon, UserCog, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { WOTipoBadge } from '@/components/workOrders/WOTipoBadge';

interface Props {
  workOrders: any[];
  pendingGpsWoIds: Set<string>;
  onAssign: (id: string, branchId: string) => void;
}

export function WOMobileList({ workOrders, pendingGpsWoIds, onAssign }: Props) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
      {workOrders.map((wo) => {
        const clientName = wo.client?.razon_social || wo.client?.nombre_comercial || '-';
        const vehicle = wo.vehicle
          ? `${wo.vehicle.marca} ${wo.vehicle.modelo} · ${wo.vehicle.patente}`
          : null;
        const tecnico = wo.tecnico
          ? `${wo.tecnico.nombre} ${wo.tecnico.apellido || ''}`.trim()
          : null;

        return (
          <div
            key={wo.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/work-orders/${wo.id}`)}
            className="px-3 py-3 active:bg-muted/40 transition-colors"
          >
            {/* Top row: folio + badge + menu */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-foreground truncate" style={{ fontSize: 14 }}>
                  {wo.folio}
                </span>
                <WOStatusBadge status={wo.estado} />
                <WOTipoBadge tipo={(wo as any).tipo} />
                {pendingGpsWoIds.has(wo.id) && (
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                )}
              </div>

              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/work-orders/${wo.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/work-orders/${wo.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {(wo.estado === 'pendiente' || wo.estado === 'asignada') && wo.branch_id && (
                      <DropdownMenuItem onClick={() => onAssign(wo.id, wo.branch_id)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Asignar técnico
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-1" style={{ fontSize: 12 }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{clientName}</span>
              </div>
              {vehicle && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{vehicle}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCog className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {tecnico || <span className="italic">Sin asignar</span>}
                  </span>
                </div>
                {wo.fecha_programada && (
                  <div className="flex items-center gap-1 shrink-0">
                    <CalIcon className="h-3.5 w-3.5" />
                    <span>{format(new Date(wo.fecha_programada), 'dd/MM HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
