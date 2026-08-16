import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSubscriptionPlans,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
} from '@/hooks/useSubscriptionPlans';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { SkeletonTableRow } from '@/components/shared/SkeletonTableRow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreVertical, Pause, Play, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { data: plans, isLoading } = useSubscriptionPlans(false);
  const updateMutation = useUpdateSubscriptionPlan();
  const deleteMutation = useDeleteSubscriptionPlan();
  const [planToDelete, setPlanToDelete] = useState<{ id: string; nombre: string } | null>(null);

  const handleToggleActive = async (id: string, activo: boolean) => {
    await updateMutation.mutateAsync({ id, activo: !activo });
  };

  const handleToggleSuspension = async (id: string, suspension_automatica: boolean) => {
    await updateMutation.mutateAsync({ id, suspension_automatica: !suspension_automatica });
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      await deleteMutation.mutateAsync(planToDelete.id);
      setPlanToDelete(null);
    } catch {
      // el toast de error ya se muestra en el hook
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Planes de Suscripción GPS"
        description="Gestiona planes, su estado y disponibilidad"
        action={
          <Button onClick={() => navigate('/subscriptions/plans/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Plan
          </Button>
        }
      />

      <div className="relative rounded-lg border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Suspensión Auto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={6} />
                ))
              ) : (
                plans?.map((plan) => (
                  <TableRow
                    key={plan.id}
                    onClick={() => navigate(`/subscriptions/plans/${plan.id}`)}
                    className={cn(
                      'cursor-pointer group',
                      'transition-all duration-150',
                      'hover:bg-muted/50 hover:shadow-sm',
                      'active:scale-[0.995]',
                      !plan.activo && 'opacity-60'
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
                    <TableCell>
                      {plan.periodo_meses} {plan.periodo_meses === 1 ? 'mes' : 'meses'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${plan.precio.toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={plan.suspension_automatica}
                        onCheckedChange={() =>
                          handleToggleSuspension(plan.id, plan.suspension_automatica)
                        }
                        className="transition-opacity active:opacity-50"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.activo}
                          onCheckedChange={() => handleToggleActive(plan.id, plan.activo)}
                          className="transition-opacity active:opacity-50"
                        />
                        <Badge variant={plan.activo ? 'default' : 'secondary'}>
                          {plan.activo ? 'Activo' : 'Pausado'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Acciones del plan">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/subscriptions/plans/${plan.id}`)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(plan.id, plan.activo)}
                          >
                            {plan.activo ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar plan
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Reactivar plan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setPlanToDelete({ id: plan.id, nombre: plan.nombre })
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el plan "{planToDelete?.nombre}". Si el plan tiene
              suscripciones asociadas no podrá eliminarse; en ese caso puedes pausarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
