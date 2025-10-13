import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOTMap } from '@/hooks/useOTMap';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { MapPin, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-500',
  asignada: 'bg-blue-500',
  programada: 'bg-green-500',
  en_ruta: 'bg-purple-500',
  en_proceso: 'bg-orange-500',
  completada: 'bg-green-600',
  cancelada: 'bg-red-500',
  reprogramada: 'bg-amber-500'
};

export function OTMapView() {
  const { filters } = useDashboardFilters();
  const { data: pins, isLoading } = useOTMap(filters.branch_id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de OTs de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de OTs de Hoy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pins && pins.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mapa Placeholder */}
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center relative">
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Mapa interactivo disponible con Mapbox API configurada en Configuración → Integraciones
                </AlertDescription>
              </Alert>
            </div>

            {/* Lista de OTs */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {pins.length} OTs con ubicación
              </p>
              {pins.map(pin => (
                <div key={pin.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                  <div className={`w-3 h-3 rounded-full mt-1 ${STATUS_COLORS[pin.estado] || 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pin.folio}</p>
                    <p className="text-sm text-muted-foreground truncate">{pin.cliente}</p>
                    {pin.direccion && (
                      <p className="text-xs text-muted-foreground truncate">{pin.direccion}</p>
                    )}
                  </div>
                  <Badge variant="outline">{pin.estado}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay OTs programadas para hoy con ubicación georeferenciada.
              <br />
              <span className="text-sm text-muted-foreground">
                Agrega coordenadas al crear o editar una OT.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
