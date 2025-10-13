import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTopProductsServices, useInventoryRotation } from '@/hooks/useAnalytics';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { DashboardFilters } from '@/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InventoryAnalyticsChartsProps {
  filters: DashboardFilters;
}

export const InventoryAnalyticsCharts = ({ filters }: InventoryAnalyticsChartsProps) => {
  const { data: topItems, isLoading: loadingTop } = useTopProductsServices(filters, 10);
  const { data: rotation, isLoading: loadingRotation } = useInventoryRotation(
    filters.fecha_desde,
    filters.fecha_hasta
  );
  const { data: alerts } = useStockAlerts();

  const topProducts = topItems?.filter((i) => i.item_tipo === 'producto') || [];
  const topServices = topItems?.filter((i) => i.item_tipo === 'servicio') || [];

  if (loadingTop || loadingRotation) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos por Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ventas: {
                  label: 'Ventas',
                  color: 'hsl(var(--primary))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ventas_totales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Servicios por Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ventas: {
                  label: 'Ventas',
                  color: 'hsl(var(--accent))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topServices}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ventas_totales" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rotación de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Stock Promedio</TableHead>
                <TableHead className="text-right">Consumos</TableHead>
                <TableHead className="text-right">Rotación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rotation?.slice(0, 10).map((item) => (
                <TableRow key={item.product_id}>
                  <TableCell className="font-mono">{item.sku}</TableCell>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell className="text-right">{item.stock_promedio.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.consumos.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.rotacion.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de Stock Bajo Mínimo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead className="text-right">Stock Mínimo</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts?.slice(0, 10).map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.product?.nombre}</TableCell>
                  <TableCell>{alert.location?.nombre}</TableCell>
                  <TableCell className="text-right">{alert.stock_actual}</TableCell>
                  <TableCell className="text-right">{alert.stock_minimo}</TableCell>
                  <TableCell>
                    <span
                      className={
                        alert.tipo === 'sin_stock'
                          ? 'text-destructive font-semibold'
                          : 'text-warning'
                      }
                    >
                      {alert.tipo === 'sin_stock' ? 'Sin Stock' : 'Stock Bajo'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
