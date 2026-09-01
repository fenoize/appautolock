import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Plus } from 'lucide-react';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StockAlertsTableProps {
  /** Máximo de filas a mostrar */
  limit?: number;
  /** Renderiza solo la tabla, sin Card ni header (para embeber) */
  bare?: boolean;
}

export function StockAlertsTable({ limit, bare = false }: StockAlertsTableProps = {}) {
  const { data: allAlerts, isLoading } = useStockAlerts(false);
  const navigate = useNavigate();
  const alerts = limit ? allAlerts?.slice(0, limit) : allAlerts;


  const handleExport = () => {
    if (!allAlerts || allAlerts.length === 0) return;

    
    const csv = [
      ['Producto', 'Ubicación', 'Stock Actual', 'Stock Mínimo', 'Tipo'],
      ...alerts.map(a => [
        a.product?.nombre || '-',
        a.location?.nombre || '-',
        a.stock_actual.toString(),
        a.stock_minimo.toString(),
        a.tipo
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_critico_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Stock crítico exportado');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Crítico</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Crítico</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent>
        {alerts && alerts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert: any) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.product?.nombre || '-'}</TableCell>
                  <TableCell>{alert.location?.nombre || '-'}</TableCell>
                  <TableCell className="text-right">{alert.stock_actual}</TableCell>
                  <TableCell className="text-right">{alert.stock_minimo}</TableCell>
                  <TableCell>
                    <Badge variant={alert.tipo === 'sin_stock' ? 'destructive' : 'outline'}>
                      {alert.tipo === 'sin_stock' ? 'Sin Stock' : 'Stock Mínimo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/inventory')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Compra
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay alertas de stock crítico
          </p>
        )}
      </CardContent>
    </Card>
  );
}
