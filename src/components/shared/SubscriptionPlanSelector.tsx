import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionPlanSelectorProps {
  requiereSuscripcion: boolean;
  planesSeleccionados: string[];
  onToggleRequiereSuscripcion: (value: boolean) => void;
  onSelectPlanes: (planIds: string[]) => void;
}

export function SubscriptionPlanSelector({
  requiereSuscripcion,
  planesSeleccionados,
  onToggleRequiereSuscripcion,
  onSelectPlanes
}: SubscriptionPlanSelectorProps) {
  const { data: planes, isLoading } = useSubscriptionPlans(true);

  const handlePlanToggle = (planId: string, checked: boolean) => {
    if (checked) {
      onSelectPlanes([...planesSeleccionados, planId]);
    } else {
      onSelectPlanes(planesSeleccionados.filter(id => id !== planId));
    }
  };

  const handleRemovePlan = (planId: string) => {
    onSelectPlanes(planesSeleccionados.filter(id => id !== planId));
  };

  const selectedPlansData = planes?.filter(p => planesSeleccionados.includes(p.id));

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Suscripciones</CardTitle>
        <CardDescription>
          Configure si este ítem requiere suscripción y qué planes están disponibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="requiere-suscripcion" className="text-base font-semibold">
              Requiere Suscripción
            </Label>
            <p className="text-sm text-muted-foreground">
              Activar si este producto/servicio necesita suscripción GPS
            </p>
          </div>
          <Switch
            id="requiere-suscripcion"
            checked={requiereSuscripcion}
            onCheckedChange={onToggleRequiereSuscripcion}
          />
        </div>

        {/* Selector de planes - Solo visible si requiere suscripción */}
        {requiereSuscripcion && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Planes Disponibles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Seleccione los planes de suscripción que se pueden ofrecer con este ítem
              </p>
              
              {planes && planes.length > 0 ? (
                <div className="space-y-2">
                  {planes.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`plan-${plan.id}`}
                        checked={planesSeleccionados.includes(plan.id)}
                        onCheckedChange={(checked) => handlePlanToggle(plan.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`plan-${plan.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{plan.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {plan.periodo_meses} {plan.periodo_meses === 1 ? 'mes' : 'meses'} - ${plan.precio.toLocaleString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay planes de suscripción disponibles
                </p>
              )}
            </div>

            {/* Planes seleccionados */}
            {selectedPlansData && selectedPlansData.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Planes Seleccionados</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlansData.map((plan) => (
                    <Badge
                      key={plan.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      <span>{plan.nombre}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlan(plan.id)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
