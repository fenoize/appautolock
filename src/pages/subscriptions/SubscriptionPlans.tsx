import { useNavigate } from 'react-router-dom';
import { useSubscriptionPlans, useUpdateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, Plus, ChevronRight } from 'lucide-react';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { data: plans, isLoading } = useSubscriptionPlans(false);
  const updateMutation = useUpdateSubscriptionPlan();

  const handleToggleActive = async (id: string, activo: boolean) => {
    await updateMutation.mutateAsync({ id, activo: !activo });
  };

  const handleToggleSuspension = async (id: string, suspension_automatica: boolean) => {
    await updateMutation.mutateAsync({ id, suspension_automatica: !suspension_automatica });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Planes de Suscripción GPS"
        description="Gestiona planes y configuración de notificaciones"
        action={
          <Button onClick={() => navigate('/subscriptions/plans/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Plan
          </Button>
        }
      />

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
                  <TableHead>Recordatorios</TableHead>
                  <TableHead>Suspensión Auto</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => (
                  <TableRow 
                    key={plan.id}
                    onClick={() => navigate(`/subscriptions/plans/${plan.id}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
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
                      <Badge variant="outline">
                        {plan.notificacion_config?.recordatorios?.filter(r => r.activo).length || 0} activos
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={plan.suspension_automatica}
                        onCheckedChange={() => handleToggleSuspension(plan.id, plan.suspension_automatica)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={plan.activo}
                        onCheckedChange={() => handleToggleActive(plan.id, plan.activo)}
                      />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
