import { useWorkOrders } from '@/hooks/useWorkOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WOStatusBadge } from '@/components/workOrders/WOStatusBadge';
import { Calendar, User, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface VehicleServiceHistoryProps {
  vehicleId: string;
}

export function VehicleServiceHistory({ vehicleId }: VehicleServiceHistoryProps) {
  const navigate = useNavigate();
  const { data: workOrders, isLoading } = useWorkOrders();

  // Filtrar órdenes de trabajo por vehículo
  const vehicleWorkOrders = workOrders?.filter(wo => wo.vehicle_id === vehicleId) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Servicios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2 p-4 border rounded-lg">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (vehicleWorkOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay órdenes de trabajo registradas para este vehículo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Servicios</CardTitle>
        <p className="text-sm text-muted-foreground">
          {vehicleWorkOrders.length} {vehicleWorkOrders.length === 1 ? 'orden de trabajo' : 'órdenes de trabajo'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {vehicleWorkOrders.map(wo => (
          <div
            key={wo.id}
            onClick={() => navigate(`/work-orders/${wo.id}`)}
            className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors space-y-3"
          >
            {/* Header con folio y estado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{wo.folio}</span>
              </div>
              <WOStatusBadge status={wo.estado} />
            </div>

            {/* Fecha programada */}
            {wo.fecha_programada && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(wo.fecha_programada), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
            )}

            {/* Técnico asignado */}
            {wo.tecnico && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {wo.tecnico.nombre} {wo.tecnico.apellido || ''}
                </span>
              </div>
            )}

            {/* Duración */}
            {wo.duracion_minutos && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{wo.duracion_minutos} minutos</span>
              </div>
            )}

            {/* Items de servicio */}
            {wo.items && wo.items.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {wo.items.slice(0, 3).map(item => (
                  <Badge key={item.id} variant="secondary" className="text-xs">
                    {item.nombre}
                  </Badge>
                ))}
                {wo.items.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{wo.items.length - 3} más
                  </Badge>
                )}
              </div>
            )}

            {/* Notas (si existen) */}
            {wo.notas && (
              <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                {wo.notas}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
