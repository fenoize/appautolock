import { useNavigate } from 'react-router-dom';
import { FileText, Wrench, Users, AlertTriangle, Package } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { IngresoEstimadoCard } from '@/components/dashboard/IngresoEstimadoCard';
import { VendedorRankingTable } from '@/components/dashboard/VendedorRankingTable';
import { TecnicoRankingTable } from '@/components/dashboard/TecnicoRankingTable';
import { SLACard } from '@/components/dashboard/SLACard';
import { OTMapView } from '@/components/dashboard/OTMapView';
import { TopItemsTable } from '@/components/dashboard/TopItemsTable';
import { StockAlertsTable } from '@/components/dashboard/StockAlertsTable';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useDashboardStats, useProximasOTs } from '@/hooks/useDashboardStats';
import { useExpiringSubscriptions } from '@/hooks/useSubscriptions';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { filters } = useDashboardFilters();
  const { data: stats } = useDashboardStats();
  const { data: proximasOTs } = useProximasOTs(5);
  const { data: expiringSubs } = useExpiringSubscriptions(30);
  const { hasRole, hasAnyRole } = usePermissions();
  
  // Role-aware: definir qué componentes mostrar
  const isVendedor = hasRole('vendedor');
  const isTecnico = hasRole('tecnico');
  const canViewInventory = hasAnyRole(['admin', 'operador']);
  const canViewQuotes = hasAnyRole(['admin', 'operador', 'vendedor']);

  return (
    <PageContainer>
      <PageHeader
        title="Escritorio"
        description="Resumen de actividad y métricas clave"
      />

      <DashboardFilters />

      {/* Fila 1: KPIs (5 columnas en desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {!isVendedor && (
          <KPICard
            title="Cotizaciones Abiertas"
            value={stats?.cotizaciones_abiertas || 0}
            icon={FileText}
            color="blue"
            onClick={() => navigate('/quotes')}
          />
        )}
        {!isVendedor && (
          <KPICard
            title="OTs Hoy"
            value={stats?.ots_hoy || 0}
            icon={Wrench}
            color="orange"
            onClick={() => navigate('/work-orders')}
          />
        )}
        {canViewQuotes && (
          <KPICard
            title="Nuevos Clientes"
            value={0}
            icon={Users}
            color="green"
            onClick={() => navigate('/clients')}
          />
        )}
        {canViewInventory && (
          <KPICard
            title="Suscripciones Vencen 7d"
            value={stats?.subscripciones_vencen || 0}
            urgent={stats?.subscripciones_vencen && stats.subscripciones_vencen > 5}
            icon={AlertTriangle}
            color="red"
            onClick={() => navigate('/subscriptions')}
          />
        )}
        {canViewInventory && (
          <KPICard
            title="Stock Crítico"
            value={stats?.stock_critico || 0}
            urgent={stats?.stock_critico && stats.stock_critico > 0}
            icon={Package}
            color="yellow"
            onClick={() => navigate('/inventory/alerts')}
          />
        )}
        {canViewQuotes && <IngresoEstimadoCard />}
      </div>

      {/* Fila 2: Próximas OTs */}
      {proximasOTs && proximasOTs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Próximas Órdenes de Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximasOTs.map((ot: any) => (
                <div
                  key={ot.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/work-orders/${ot.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{ot.folio}</p>
                    <p className="text-sm text-muted-foreground">
                      {ot.clients?.razon_social || ot.clients?.nombre_comercial} - {ot.vehicles?.patente}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm">
                        {ot.fecha_programada && format(new Date(ot.fecha_programada), 'PPP', { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ot.profiles?.nombre} {ot.profiles?.apellido}
                      </p>
                    </div>
                    <Badge variant="outline">{ot.estado}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fila 3: Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {canViewQuotes && <VendedorRankingTable />}
        {!isVendedor && <TecnicoRankingTable />}
      </div>

      {/* Fila 4: SLA + Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {!isVendedor && <SLACard />}
        {!isVendedor && <OTMapView />}
      </div>

      {/* Fila 5: Alertas (Subs y Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {canViewInventory && <StockAlertsTable />}
        {expiringSubs && expiringSubs.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vencimientos GPS próximos</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subscriptions/expiring')}>
                Ver todos →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringSubs.slice(0, 5).map((s: any) => {
                  const dias = Math.max(0, Math.ceil((new Date(s.fecha_vencimiento).getTime() - Date.now()) / 86400000));
                  const color = dias <= 3 ? 'destructive' : dias <= 10 ? 'default' : 'secondary';
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/subscriptions/${s.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {s.client?.razon_social || s.client?.nombre_comercial || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.vehicle?.patente || '—'} · {s.plan?.nombre || '—'}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm">{format(new Date(s.fecha_vencimiento), 'dd MMM', { locale: es })}</p>
                        <Badge variant={color as any} className="text-xs">{dias} días</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fila 6: Top Items */}
      <div className="mb-6">
        {canViewInventory && <TopItemsTable />}
      </div>
    </PageContainer>
  );
};

export default Dashboard;
