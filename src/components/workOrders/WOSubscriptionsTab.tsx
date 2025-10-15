import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWOSubscriptionItems, WOSubscriptionItem } from '@/hooks/useWOSubscriptionItems';
import { WOSubscriptionConfig } from './WOSubscriptionConfig';
import { Package, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

interface WOSubscriptionsTabProps {
  woId: string;
  woStatus: string;
}

export function WOSubscriptionsTab({ woId, woStatus }: WOSubscriptionsTabProps) {
  const { data: subscriptionItems, isLoading } = useWOSubscriptionItems(woId);
  const { data: allPlans } = useSubscriptionPlans();
  const [selectedItem, setSelectedItem] = useState<WOSubscriptionItem | null>(null);
  const navigate = useNavigate();

  const isCompleted = woStatus === 'completada';

  // Helper para obtener planes disponibles de un item
  const getPlanesDisponibles = (item: WOSubscriptionItem) => {
    if (!allPlans) return [];
    const tiposDisponibles = item.product?.tipos_suscripcion_disponibles || 
                            item.service?.tipos_suscripcion_disponibles || 
                            [];
    if (tiposDisponibles.length === 0) return allPlans;
    return allPlans.filter(plan => tiposDisponibles.includes(plan.id));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!subscriptionItems || subscriptionItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No hay items que requieran suscripción</p>
            <p className="text-sm mt-2">Esta orden de trabajo no contiene productos o servicios con suscripción GPS</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (item: any) => {
    if (item.subscription_id) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Activa
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge variant="secondary" className="bg-blue-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente Configuración
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        Esperando Completar OT
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {!isCompleted && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800">
              ⚠️ Esta orden de trabajo debe estar <strong>completada</strong> para poder configurar las suscripciones.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {subscriptionItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{item.nombre}</CardTitle>
                    {getStatusBadge(item)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tipo: <span className="capitalize">{item.item_tipo}</span>
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Planes disponibles */}
              {(() => {
                const planes = getPlanesDisponibles(item);
                return planes.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Planes Disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                      {planes.map((plan) => (
                        <Badge key={plan.id} variant="outline">
                          {plan.nombre} - ${plan.precio.toLocaleString('es-CL')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Números de serie (si ya tiene suscripción) */}
              {item.numeros_serie && item.numeros_serie.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Equipos Configurados:</p>
                  <div className="space-y-1">
                    {item.numeros_serie.map((equipo: any, idx: number) => (
                      <div key={idx} className="text-sm p-2 bg-muted rounded">
                        <p><strong>GPS #{idx + 1}:</strong></p>
                        <p>Equipo: {equipo.numero_equipo || 'N/A'}</p>
                        <p>Chip: {equipo.numero_chip || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                {item.subscription_id ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/subscriptions/${item.subscription_id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Suscripción
                  </Button>
                ) : isCompleted ? (
                  <Button
                    onClick={() => setSelectedItem(item)}
                    disabled={!!item.subscription_id}
                  >
                    Configurar Suscripción
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Configurar al Completar OT
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de configuración */}
      {selectedItem && (
        <WOSubscriptionConfig
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        />
      )}
    </div>
  );
}
