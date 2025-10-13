import { useNavigate } from 'react-router-dom';
import { useSubscriptionPlans, useUpdateSubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { SkeletonTableRow } from '@/components/shared/SkeletonTableRow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

      <div className="relative rounded-lg border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[800px]">
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={7} />
                ))
              ) : (
                plans?.map((plan) => (
                  <TableRow 
                    key={plan.id}
                    onClick={() => navigate(`/subscriptions/plans/${plan.id}`)}
                    className={cn(
                      "cursor-pointer group",
                      "transition-all duration-150",
                      "hover:bg-muted/50 hover:shadow-sm",
                      "hover:border-l-4 hover:border-l-primary/50",
                      "active:scale-[0.995]"
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.nombre}</p>
                        {plan.descripcion && (
                          <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{plan.periodo_meses} {plan.periodo_meses === 1 ? 'mes' : 'meses'}</TableCell>
                    <TableCell className="font-medium">${plan.precio.toLocaleString('es-CL')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {plan.notificacion_config?.recordatorios?.filter((r: any) => r.activo).length || 0} activos
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={plan.suspension_automatica}
                        onCheckedChange={() => handleToggleSuspension(plan.id, plan.suspension_automatica)}
                        className="transition-opacity active:opacity-50"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={plan.activo}
                        onCheckedChange={() => handleToggleActive(plan.id, plan.activo)}
                        className="transition-opacity active:opacity-50"
                      />
                    </TableCell>
                    <TableCell>
                      <ChevronRight 
                        className={cn(
                          "h-4 w-4 text-muted-foreground",
                          "transition-transform duration-200",
                          "group-hover:translate-x-1 group-hover:text-primary"
                        )} 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
}
