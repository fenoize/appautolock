import { useParams } from 'react-router-dom';
import { usePlanDetail } from '@/hooks/useSubscriptionPlans';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralPlanForm } from '@/components/subscriptions/GeneralPlanForm';
import { NotificationConfigForm } from '@/components/subscriptions/NotificationConfigForm';
import { NotificationDataForm } from '@/components/subscriptions/NotificationDataForm';
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
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="datos">Datos en Notificaciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralPlanForm plan={plan} />
        </TabsContent>
        
        <TabsContent value="notificaciones">
          <NotificationConfigForm plan={plan} />
        </TabsContent>
        
        <TabsContent value="datos">
          <NotificationDataForm plan={plan} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
