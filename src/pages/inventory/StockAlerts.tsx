import { useStockAlerts, useResolverAlerta } from '@/hooks/useStockAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function StockAlerts() {
  const { data: alerts, isLoading } = useStockAlerts(false);
  const resolverAlerta = useResolverAlerta();

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alertas de Stock</h1>
        <Badge variant="outline" className="text-lg">
          {alerts?.length || 0} Pendientes
        </Badge>
      </div>

      <div className="space-y-4">
        {alerts?.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                  <div>
                    <CardTitle>{alert.product?.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      SKU: {alert.product?.sku} | {alert.location?.nombre}
                    </p>
                  </div>
                </div>
                <Badge variant={alert.tipo === 'sin_stock' ? 'destructive' : 'default'}>
                  {alert.tipo === 'sin_stock' ? 'Sin Stock' : 'Bajo Mínimo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">Stock Actual:</span> {alert.stock_actual}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Stock Mínimo:</span> {alert.stock_minimo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creada: {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolverAlerta.mutate(alert.id)}
                  disabled={resolverAlerta.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar Resuelta
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!alerts || alerts.length === 0) && (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">No hay alertas pendientes</h3>
          <p className="text-muted-foreground">Todos los productos tienen stock suficiente</p>
        </div>
      )}
    </div>
  );
}
