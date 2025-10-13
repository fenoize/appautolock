import { useState } from 'react';
import { useSubscriptionPlans, useUpdateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign } from 'lucide-react';

export default function SubscriptionPlans() {
  const { data: plans, isLoading } = useSubscriptionPlans(false);
  const updateMutation = useUpdateSubscriptionPlan();

  const handleToggleActive = async (id: string, activo: boolean) => {
    await updateMutation.mutateAsync({ id, activo: !activo });
  };

  const handleToggleSuspension = async (id: string, suspension_automatica: boolean) => {
    await updateMutation.mutateAsync({ id, suspension_automatica: !suspension_automatica });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Planes de Suscripción</h1>
        <p className="text-muted-foreground">Gestión de planes GPS disponibles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planes Configurados</CardTitle>
          <CardDescription>Lista de todos los planes de suscripción</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Días de Gracia</TableHead>
                  <TableHead>Suspensión Auto</TableHead>
                  <TableHead>Activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.nombre}</p>
                        {plan.descripcion && (
                          <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.periodo_meses} {plan.periodo_meses === 1 ? 'mes' : 'meses'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${plan.precio.toLocaleString('es-CL')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.dias_gracia} días</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.suspension_automatica}
                        onCheckedChange={() => handleToggleSuspension(plan.id, plan.suspension_automatica)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.activo}
                        onCheckedChange={() => handleToggleActive(plan.id, plan.activo)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
