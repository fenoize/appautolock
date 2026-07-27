import { useParams } from 'react-router-dom';
import { usePlanDetail } from '@/hooks/useSubscriptionPlans';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { GeneralPlanForm } from '@/components/subscriptions/GeneralPlanForm';
import { SkeletonTable } from '@/components/shared/SkeletonTable';

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: plan, isLoading } = usePlanDetail(id!);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonTable />
      </PageContainer>
    );
  }

  if (!plan) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Plan no encontrado</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title={plan.nombre}
        description="Configuración del plan de suscripción"
        backButton={true}
        backTo="/subscriptions/plans"
      />

      <GeneralPlanForm plan={plan} />
    </PageContainer>
  );
}
