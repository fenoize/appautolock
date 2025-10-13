import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardFilters } from '@/components/analytics/DashboardFilters';
import { KPICard } from '@/components/analytics/KPICard';
import { InventoryAnalyticsCharts } from '@/components/analytics/InventoryAnalyticsCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardFilters as Filters } from '@/types/analytics';
import { useQuoteStats } from '@/hooks/useQuotes';
import { useWOStats } from '@/hooks/useWorkOrders';
import { useSubscriptionStats } from '@/hooks/useSubscriptions';
import { useInventoryStats } from '@/hooks/useInventoryStats';
import {
  FileText,
  Wrench,
  CalendarCheck,
  Package,
  ArrowLeft,
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState<Filters>({
    fecha_desde: firstDayOfMonth.toISOString().split('T')[0],
    fecha_hasta: today.toISOString().split('T')[0],
  });

  const { data: quoteStats } = useQuoteStats({
    fecha_desde: filters.fecha_desde,
    fecha_hasta: filters.fecha_hasta,
    branch_id: filters.branch_id,
  });

  const { data: woStats } = useWOStats({
    fecha_desde: filters.fecha_desde,
    fecha_hasta: filters.fecha_hasta,
    branch_id: filters.branch_id,
  });

  const { data: subStats } = useSubscriptionStats();
  const { data: invStats } = useInventoryStats();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
            <p className="text-muted-foreground">KPIs y métricas del negocio</p>
          </div>
        </div>

        <DashboardFilters filters={filters} onFiltersChange={setFilters} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Cotizaciones Totales"
            value={quoteStats?.total_cotizaciones || 0}
            icon={FileText}
          />
          <KPICard
            title="Tasa de Cierre"
            value={`${quoteStats?.tasa_cierre || 0}%`}
            icon={FileText}
          />
          <KPICard
            title="OTs Completadas"
            value={woStats?.completadas || 0}
            icon={Wrench}
          />
          <KPICard
            title="Suscripciones Activas"
            value={subStats?.activas || 0}
            icon={CalendarCheck}
          />
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>
            <TabsTrigger value="work-orders">Órdenes de Trabajo</TabsTrigger>
            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
          </TabsList>

          <TabsContent value="quotes">
            <div className="text-center py-12 text-muted-foreground">
              Análisis de cotizaciones próximamente
            </div>
          </TabsContent>

          <TabsContent value="work-orders">
            <div className="text-center py-12 text-muted-foreground">
              Análisis de OTs próximamente
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="text-center py-12 text-muted-foreground">
              Análisis de suscripciones próximamente
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryAnalyticsCharts filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
