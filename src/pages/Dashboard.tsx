import { useNavigate } from 'react-router-dom';
import { FileText, Wrench, Users, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { VendedorRankingTable } from '@/components/dashboard/VendedorRankingTable';
import { TecnicoRankingTable } from '@/components/dashboard/TecnicoRankingTable';
import { SLACard } from '@/components/dashboard/SLACard';
import { TopItemsTable } from '@/components/dashboard/TopItemsTable';
import { StockAlertsTable } from '@/components/dashboard/StockAlertsTable';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringSubscriptions } from '@/hooks/useSubscriptions';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

const formatAxisCLP = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '—';

const Dashboard = () => {
  const navigate = useNavigate();
  const { filters } = useDashboardFilters();
  const { data: stats } = useDashboardStats();
  const { data: expiringSubs } = useExpiringSubscriptions(30);
  const { hasRole, hasAnyRole } = usePermissions();

  // Role-aware: definir qué componentes mostrar
  const isVendedor = hasRole('vendedor');
  const canViewInventory = hasAnyRole(['admin', 'operador']);
  const canViewQuotes = hasAnyRole(['admin', 'operador', 'vendedor']);

  const s = stats as any;
  const mrr = s?.mrr_gps ?? 0;
  const tasaRenovacion = s?.tasa_renovacion;

  return (
    <PageContainer>
      <PageHeader title="Escritorio" description="Resumen de actividad y métricas clave" />

      <DashboardFilters />

      {/* 2. Fila KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {!isVendedor && (
          <KPICard
            title="Cotizaciones abiertas"
            value={stats?.cotizaciones_abiertas || 0}
            icon={FileText}
            color="blue"
            onClick={() => navigate('/quotes')}
          />
        )}
        {!isVendedor && (
          <KPICard
            title="OTs hoy"
            value={stats?.ots_hoy || 0}
            icon={Wrench}
            color="purple"
            onClick={() => navigate('/work-orders')}
          />
        )}
        {canViewInventory && (
          <KPICard
            title="Ingresos del mes"
            value={formatCLP(stats?.ingresos_mes ?? 0)}
            icon={DollarSign}
            color="green"
            description="OTs completadas"
            onClick={() => navigate('/work-orders')}
          />
        )}
        {canViewQuotes && (
          <KPICard
            title="Nuevos clientes"
            value={stats?.nuevos_clientes_mes ?? 0}
            icon={Users}
            color="green"
            onClick={() => navigate('/clients')}
          />
        )}
        {canViewInventory && (
          <KPICard
            title="GPS por vencer"
            value={stats?.subscripciones_vencen || 0}
            urgent={!!stats?.subscripciones_vencen && stats.subscripciones_vencen > 0}
            icon={AlertTriangle}
            color="yellow"
            onClick={() => navigate('/subscriptions/expiring')}
          />
        )}
        {canViewInventory && (
          <KPICard
            title="Stock crítico"
            value={stats?.stock_critico || 0}
            urgent={!!stats?.stock_critico && stats.stock_critico > 0}
            icon={Package}
            color="red"
            onClick={() => navigate('/inventory/alerts')}
          />
        )}
      </div>

      {/* 3. Gráfico + MRR */}
      {canViewInventory && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ingresos mensuales</CardTitle>
              <p className="text-sm text-muted-foreground">Últimos 6 meses · OTs completadas</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.ingresos_por_mes ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickFormatter={formatAxisCLP}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: any) => [formatCLP(Number(value)), 'Ingresos']}
                  />
                  <Area
                    dataKey="ingresos"
                    type="monotone"
                    fill="hsl(var(--primary) / 0.15)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>MRR GPS</CardTitle>
              <p className="text-sm text-muted-foreground">Ingreso recurrente mensual</p>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                MRR total
              </p>
              <p className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-foreground">
                {formatCLP(mrr)}
              </p>
              {s?.mrr_gps_delta !== undefined && s?.mrr_gps_delta !== null && (
                <p className={cn('mt-1 text-xs font-medium', Number(s.mrr_gps_delta) >= 0 ? 'text-success' : 'text-destructive')}>
                  {Number(s.mrr_gps_delta) >= 0 ? '+' : ''}{s.mrr_gps_delta}% vs mes anterior
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ARR proyectado
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatCLP(mrr * 12)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tasa renovación
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-sm font-semibold',
                      typeof tasaRenovacion === 'number' && tasaRenovacion >= 80 && 'text-success'
                    )}
                  >
                    {tasaRenovacion ?? '—'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Tres columnas medias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {!isVendedor && <TecnicoRankingTable />}
        {canViewQuotes && <VendedorRankingTable />}
        {expiringSubs && expiringSubs.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Vencimientos GPS</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subscriptions/expiring')}>
                Ver todos →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiringSubs.slice(0, 5).map((sub: any) => {
                  const dias = Math.max(
                    0,
                    Math.ceil((new Date(sub.fecha_vencimiento).getTime() - Date.now()) / 86400000)
                  );
                  const bar = dias <= 3 ? 'bg-destructive' : dias <= 7 ? 'bg-warning' : 'bg-success';
                  const badge = dias <= 3 ? 'destructive' : dias <= 7 ? 'default' : 'secondary';
                  const nombre = sub.client?.razon_social || sub.client?.nombre_comercial || '—';
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 rounded-lg border p-2 pl-0 hover:bg-muted/50 cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/subscriptions/${sub.id}`)}
                    >
                      <div className={cn('h-10 w-1 shrink-0 rounded-r', bar)} />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                        {getInitials(nombre)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">{sub.vehicle?.patente || '—'}</p>
                      </div>
                      <Badge variant={badge as any} className="shrink-0 text-xs">
                        {dias} días
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 5. Stock crítico (limitado) */}
      {canViewInventory && (
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Stock crítico</CardTitle>
                <p className="text-sm text-muted-foreground">
                  ({stats?.stock_critico ?? 0} productos bajo mínimo)
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/alerts')}>
                Ver todos →
              </Button>
            </CardHeader>
            <CardContent>
              <StockAlertsTable limit={5} bare />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {!isVendedor && <SLACard />}
        {canViewInventory && <TopItemsTable />}
      </div>
    </PageContainer>
  );
};

export default Dashboard;
