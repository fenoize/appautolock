import { KPICard } from './KPICard';
import { DollarSign } from 'lucide-react';
import { useIngresoEstimado } from '@/hooks/useIngresoEstimado';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { Skeleton } from '@/components/ui/skeleton';

export function IngresoEstimadoCard() {
  const { filters } = useDashboardFilters();
  const { data: ingreso, isLoading } = useIngresoEstimado(filters);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <KPICard
      title="Ingreso Estimado"
      value={`$${ingreso?.neto_estimado.toLocaleString('es-CL') || 0}`}
      icon={DollarSign}
      color="green"
    />
  );
}
