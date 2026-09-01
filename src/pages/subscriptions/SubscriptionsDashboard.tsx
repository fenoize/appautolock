import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Radio,
  TrendingUp,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Info,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { RenewalActionModal } from '@/components/subscriptions/RenewalActionModal';
import {
  useSubscriptionsDashboardData,
  periodRange,
  type DashboardPeriod,
  type DashboardSubscription,
} from '@/hooks/useSubscriptionsDashboard';

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

const clientName = (s: DashboardSubscription) =>
  s.client?.razon_social || s.client?.nombre_comercial || 'Sin cliente';

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';

const daysBetween = (a: Date, b: Date) =>
  Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

function Delta({ value, label }: { value: number; label: string }) {
  const sign = value > 0 ? '+' : '';
  return (
    <p
      className={cn(
        'text-xs mt-1',
        value > 0 ? 'text-emerald-600' : value < 0 ? 'text-destructive' : 'text-muted-foreground'
      )}
    >
      {sign}
      {value} {label}
    </p>
  );
}

function InfoLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function KpiCard({
  title,
  icon: Icon,
  stripe,
  count,
  amount,
  amountLabel,
  delta,
  deltaLabel,
}: {
  title: string;
  icon: any;
  stripe: string;
  count: number;
  amount: number;
  amountLabel: string;
  delta: number;
  deltaLabel: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={cn('absolute inset-x-0 top-0 h-1', stripe)} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold mt-2 leading-none">{count}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {clp(amount)} <span className="text-xs">{amountLabel}</span>
            </p>
            <Delta value={delta} label={deltaLabel} />
          </div>
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  sub,
  right,
  action,
}: {
  sub: DashboardSubscription;
  right: React.ReactNode;
  action: React.ReactNode;
}) {
  const name = clientName(sub);
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {sub.vehicle?.patente || 'Sin patente'}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {sub.plan?.nombre ?? '-'} · {clp(sub.plan?.precio ?? 0)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        {action}
      </div>
    </div>
  );
}

export default function SubscriptionsDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<DashboardPeriod>('mes');
  const { data: subs, isLoading } = useSubscriptionsDashboardData();
  const [renewTarget, setRenewTarget] = useState<DashboardSubscription | null>(null);

  const m = useMemo(() => {
    const list = subs ?? [];
    const { start, prevStart, prevEnd, now } = periodRange(period);
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const price = (s: DashboardSubscription) => s.plan?.precio ?? 0;
    const sum = (arr: DashboardSubscription[]) => arr.reduce((t, s) => t + price(s), 0);

    const activas = list.filter(s => s.estado === 'activa');
    const nuevas = list.filter(s => new Date(s.fecha_inicio) >= start);
    const nuevasPrev = list.filter(s => {
      const d = new Date(s.fecha_inicio);
      return d >= prevStart && d < prevEnd;
    });
    const porVencer = activas.filter(s => {
      const d = new Date(s.fecha_vencimiento);
      return d >= now && d <= in7;
    });
    const vencidas = list.filter(
      s => ['mora', 'cancelada'].includes(s.estado) && new Date(s.fecha_vencimiento) < now
    );
    const vencidasPeriodo = vencidas.filter(s => new Date(s.fecha_vencimiento) >= start);

    const mrr = sum(activas);
    const mrrPrev = sum(
      activas.filter(s => new Date(s.fecha_inicio) < prevEnd)
    );
    const mrrDeltaPct = mrrPrev > 0 ? ((mrr - mrrPrev) / mrrPrev) * 100 : 0;

    const baseInicio = activas.length + vencidasPeriodo.length;
    const renovacion = baseInicio > 0 ? (1 - vencidasPeriodo.length / baseInicio) * 100 : 100;

    const porPlan = Object.values(
      activas.reduce<Record<string, { nombre: string; count: number; monto: number }>>((acc, s) => {
        const nombre = s.plan?.nombre ?? 'Sin plan';
        acc[nombre] = acc[nombre] || { nombre, count: 0, monto: 0 };
        acc[nombre].count += 1;
        acc[nombre].monto += price(s);
        return acc;
      }, {})
    ).sort((a, b) => b.count - a.count);

    const nuevasLista = [...nuevas]
      .sort((a, b) => +new Date(b.fecha_inicio) - +new Date(a.fecha_inicio))
      .slice(0, 10);
    const porVencerLista = [...porVencer]
      .sort((a, b) => +new Date(a.fecha_vencimiento) - +new Date(b.fecha_vencimiento))
      .slice(0, 10);

    return {
      now,
      activas,
      nuevas,
      nuevasDelta: nuevas.length - nuevasPrev.length,
      porVencer,
      vencidas,
      mrr,
      mrrDeltaPct,
      arr: mrr * 12,
      renovacion,
      porPlan,
      maxPlan: Math.max(1, ...porPlan.map(p => p.count)),
      nuevasLista,
      porVencerLista,
      sum,
    };
  }, [subs, period]);

  const periodLabel =
    period === 'mes'
      ? 'mes anterior'
      : period === '3meses'
        ? 'período anterior'
        : 'año anterior';

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard Suscripciones GPS"
        description={format(new Date(), "MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        action={
          <Tabs value={period} onValueChange={v => setPeriod(v as DashboardPeriod)}>
            <TabsList>
              <TabsTrigger value="mes">Este mes</TabsTrigger>
              <TabsTrigger value="3meses">Últimos 3 meses</TabsTrigger>
              <TabsTrigger value="anio">Este año</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Activas"
              icon={Radio}
              stripe="bg-emerald-500"
              count={m.activas.length}
              amount={m.mrr}
              amountLabel="/mes"
              delta={m.nuevasDelta}
              deltaLabel={`vs ${periodLabel}`}
            />
            <KpiCard
              title="Nuevas"
              icon={TrendingUp}
              stripe="bg-blue-500"
              count={m.nuevas.length}
              amount={m.sum(m.nuevas)}
              amountLabel="ingresados"
              delta={m.nuevasDelta}
              deltaLabel={`vs ${periodLabel}`}
            />
            <KpiCard
              title="Próximas a vencer"
              icon={AlertTriangle}
              stripe="bg-amber-500"
              count={m.porVencer.length}
              amount={m.sum(m.porVencer)}
              amountLabel="en riesgo"
              delta={0}
              deltaLabel="próximos 7 días"
            />
            <KpiCard
              title="Vencidas / Mora"
              icon={XCircle}
              stripe="bg-destructive"
              count={m.vencidas.length}
              amount={m.sum(m.vencidas)}
              amountLabel="sin renovar"
              delta={0}
              deltaLabel="acumuladas"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métricas financieras</CardTitle>
              </CardHeader>
              <TooltipProvider>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      <InfoLabel
                        label="MRR total"
                        tooltip="Ingreso Recurrente Mensual. Es la suma del precio de todas las suscripciones activas en un mes."
                      />
                    </p>
                    <p className="text-3xl font-bold">{clp(m.mrr)}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        m.mrrDeltaPct >= 0 ? 'text-emerald-600' : 'text-destructive'
                      )}
                    >
                      {m.mrrDeltaPct >= 0 ? '+' : ''}
                      {m.mrrDeltaPct.toFixed(1)}% vs {periodLabel}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        <InfoLabel
                          label="ARR proyectado"
                          tooltip="Ingreso Recurrente Anual proyectado. Es el MRR multiplicado por 12."
                        />
                      </p>
                      <p className="text-lg font-semibold">{clp(m.arr)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        <InfoLabel
                          label="Tasa de renovación"
                          tooltip="Porcentaje de suscripciones que se renuevan al vencer. Se calcula sobre las suscripciones vencidas en el período seleccionado."
                        />
                      </p>
                      <p className="text-lg font-semibold">{m.renovacion.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </TooltipProvider>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución por plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.porPlan.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin suscripciones activas.</p>
                )}
                {m.porPlan.map(p => (
                  <div key={p.nombre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{p.nombre}</span>
                      <span className="text-muted-foreground">
                        {p.count} · {clp(p.monto)}
                      </span>
                    </div>
                    <Progress value={(p.count / m.maxPlan) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nuevas del período</CardTitle>
              </CardHeader>
              <CardContent>
                {m.nuevasLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin nuevas suscripciones.</p>
                ) : (
                  m.nuevasLista.map(s => (
                    <Row
                      key={s.id}
                      sub={s}
                      right={
                        <Badge variant="secondary">
                          Hace {Math.max(0, daysBetween(m.now, new Date(s.fecha_inicio)))}d
                        </Badge>
                      }
                      action={
                        <Button size="sm" variant="outline" onClick={() => navigate(`/subscriptions/${s.id}`)}>
                          Ver
                        </Button>
                      }
                    />
                  ))
                )}
                <Button
                  variant="link"
                  className="mt-2 px-0"
                  onClick={() => navigate('/subscriptions/list')}
                >
                  Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximas a vencer (7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                {m.porVencerLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin vencimientos próximos.</p>
                ) : (
                  m.porVencerLista.map(s => {
                    const dias = Math.max(0, daysBetween(new Date(s.fecha_vencimiento), m.now));
                    return (
                      <Row
                        key={s.id}
                        sub={s}
                        right={
                          <span
                            className={cn(
                              'rounded-md px-2 py-1 text-xs font-medium text-white',
                              dias <= 1 ? 'bg-destructive' : dias <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                            )}
                          >
                            {dias}d
                          </span>
                        }
                        action={
                          <Button size="sm" variant="outline" onClick={() => setRenewTarget(s)}>
                            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Renovar
                          </Button>
                        }
                      />
                    );
                  })
                )}
                <Button
                  variant="link"
                  className="mt-2 px-0"
                  onClick={() => navigate('/subscriptions/expiring')}
                >
                  Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {renewTarget && (
        <RenewalActionModal
          open={!!renewTarget}
          onOpenChange={open => !open && setRenewTarget(null)}
          mode="renovar"
          subscription={{
            id: renewTarget.id,
            folio: renewTarget.folio,
            fecha_vencimiento: renewTarget.fecha_vencimiento,
            client: renewTarget.client ?? undefined,
            vehicle: renewTarget.vehicle ?? undefined,
            plan: renewTarget.plan ?? undefined,
          } as any}
        />
      )}
    </PageContainer>
  );
}
