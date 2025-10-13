import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTopServicios, useTopProductos } from '@/hooks/useTopItems';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function TopItemsTable() {
  const { filters } = useDashboardFilters();
  const { data: servicios, isLoading: loadingS } = useTopServicios(filters);
  const { data: productos, isLoading: loadingP } = useTopProductos(filters);

  const handleExportServicios = () => {
    if (!servicios || servicios.length === 0) return;
    
    const csv = [
      ['Servicio', 'Cantidad Total', 'Monto Total'],
      ...servicios.map(s => [s.nombre, s.qty_total.toString(), s.monto_total.toFixed(0)])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top_servicios_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Top servicios exportado');
  };

  const handleExportProductos = () => {
    if (!productos || productos.length === 0) return;
    
    const csv = [
      ['Producto', 'Cantidad Total', 'Monto Total'],
      ...productos.map(p => [p.nombre, p.qty_total.toString(), p.monto_total.toFixed(0)])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top_productos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Top productos exportado');
  };

  if (loadingS || loadingP) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Servicios y Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Servicios y Productos (Período)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="servicios">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>

          {/* Tab Servicios */}
          <TabsContent value="servicios">
            <div className="flex justify-end mb-3">
              <Button variant="outline" size="sm" onClick={handleExportServicios}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
            {servicios && servicios.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicios.map((s, index) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {index + 1}. {s.nombre}
                      </TableCell>
                      <TableCell className="text-right">{s.qty_total}</TableCell>
                      <TableCell className="text-right">
                        ${s.monto_total.toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos de servicios en el período
              </p>
            )}
          </TabsContent>

          {/* Tab Productos */}
          <TabsContent value="productos">
            <div className="flex justify-end mb-3">
              <Button variant="outline" size="sm" onClick={handleExportProductos}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
            {productos && productos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((p, index) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {index + 1}. {p.nombre}
                      </TableCell>
                      <TableCell className="text-right">{p.qty_total}</TableCell>
                      <TableCell className="text-right">
                        ${p.monto_total.toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos de productos en el período
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
