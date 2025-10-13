import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Wrench, Users, DollarSign, AlertTriangle, Package } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useProximasOTs } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: proximasOTs } = useProximasOTs(5);

  return (
    <PageContainer>
      <PageHeader
        title="Escritorio"
        description="Resumen de actividad y métricas clave"
        action={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/quotes/new')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
            <Button onClick={() => navigate('/work-orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva OT
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Cotizaciones Abiertas"
          value={stats?.cotizaciones_abiertas || 0}
          icon={FileText}
          color="blue"
          onClick={() => navigate('/quotes')}
        />
        <KPICard
          title="OTs Hoy"
          value={stats?.ots_hoy || 0}
          icon={Wrench}
          color="orange"
          onClick={() => navigate('/work-orders')}
        />
        <KPICard
          title="Suscripciones Vencen 7d"
          value={stats?.subscripciones_vencen || 0}
          urgent={stats?.subscripciones_vencen && stats.subscripciones_vencen > 5}
          icon={AlertTriangle}
          color="red"
          onClick={() => navigate('/subscriptions')}
        />
        <KPICard
          title="Stock Crítico"
          value={stats?.stock_critico || 0}
          urgent={stats?.stock_critico && stats.stock_critico > 0}
          icon={Package}
          color="yellow"
          onClick={() => navigate('/inventory/alerts')}
        />
      </div>

      {/* Próximas OTs */}
      {proximasOTs && proximasOTs.length > 0 && (
        <Card>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/clients/new')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Nuevo Cliente</p>
              <p className="text-sm text-muted-foreground">Agregar cliente a la cartera</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/vehicles/new')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-medium">Nuevo Vehículo</p>
              <p className="text-sm text-muted-foreground">Registrar vehículo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/analytics')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium">Ver Reportes</p>
              <p className="text-sm text-muted-foreground">Análisis y métricas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
