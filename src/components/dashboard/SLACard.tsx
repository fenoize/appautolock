import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useSLAStats } from '@/hooks/useSLAStats';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const COLORS = {
  cumplidas: '#10b981',
  reprogramadas: '#f59e0b',
  atrasadas: '#ef4444'
};

export function SLACard() {
  const { filters } = useDashboardFilters();
  const { data: sla, isLoading } = useSLAStats(filters);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SLA de OTs</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!sla || sla.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SLA de OTs (Período)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay OTs en el período seleccionado
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Cumplidas', value: sla.cumplidas, color: COLORS.cumplidas },
    { name: 'Reprogramadas', value: sla.reprogramadas, color: COLORS.reprogramadas },
    { name: 'Atrasadas', value: sla.atrasadas, color: COLORS.atrasadas }
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA de OTs (Período)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico Donut */}
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cifras */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Cumplidas en hora</span>
              </div>
              <span className="text-lg font-bold">{sla.cumplidas}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Reprogramadas</span>
              </div>
              <span className="text-lg font-bold">{sla.reprogramadas}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Atrasadas</span>
              </div>
              <span className="text-lg font-bold">{sla.atrasadas}</span>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Cumplimiento</p>
                <p className="text-3xl font-bold text-green-500">
                  {sla.porcentaje_cumplimiento.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
