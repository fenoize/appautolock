import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useSubscriptionStats } from '@/hooks/useSubscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, DollarSign, AlertCircle, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function SubscriptionReports() {
  const { data: stats } = useSubscriptionStats();
  const { data: proximasRenovaciones } = useSubscriptions({
    vencimiento_desde: new Date().toISOString().split('T')[0],
    vencimiento_hasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const { data: enMora } = useSubscriptions({ estado: 'mora' });
  const { data: suspendidas } = useSubscriptions({ estado: 'suspendida' });

  const statsCards = [
    { title: 'Total Suscripciones', value: stats?.total || 0, icon: CalendarDays },
    { title: 'Activas', value: stats?.activas || 0, icon: CalendarDays, color: 'text-green-600' },
    { title: 'En Mora', value: stats?.en_mora || 0, icon: AlertCircle, color: 'text-orange-600' },
    { title: 'Suspendidas', value: stats?.suspendidas || 0, icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reportes de Suscripciones</h1>
        <p className="text-muted-foreground">Dashboard de métricas y estadísticas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ingresos Mensuales Estimados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats?.ingresos_mensuales_estimados.toLocaleString('es-CL') || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Basado en {stats?.activas || 0} suscripciones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Renovaciones Próximas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Próximos 7 días</span>
              <Badge variant="destructive">{stats?.renovaciones_proximas_7d || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Próximos 30 días</span>
              <Badge variant="outline">{stats?.renovaciones_proximas_30d || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Renovaciones Próximas (30 días)</CardTitle>
            <CardDescription>Suscripciones que vencen pronto</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximasRenovaciones?.slice(0, 10).map((sub) => {
                  const diasRestantes = differenceInDays(new Date(sub.fecha_vencimiento), new Date());
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.folio}</TableCell>
                      <TableCell className="text-sm">
                        {sub.client?.razon_social || sub.client?.nombre_comercial}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(sub.fecha_vencimiento), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={diasRestantes <= 7 ? 'destructive' : 'outline'}>
                          {diasRestantes} días
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suscripciones en Mora</CardTitle>
            <CardDescription>Requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Días de Mora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enMora?.slice(0, 10).map((sub) => {
                  const diasMora = differenceInDays(new Date(), new Date(sub.fecha_vencimiento));
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.folio}</TableCell>
                      <TableCell className="text-sm">
                        {sub.client?.razon_social || sub.client?.nombre_comercial}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{diasMora} días</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
