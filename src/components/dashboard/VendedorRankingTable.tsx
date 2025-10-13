import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useVendedorRanking } from '@/hooks/useVendedorRanking';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function VendedorRankingTable() {
  const { filters } = useDashboardFilters();
  const { data: ranking, isLoading } = useVendedorRanking(filters);
  const navigate = useNavigate();

  const handleExport = () => {
    if (!ranking || ranking.length === 0) return;
    
    const csv = [
      ['Vendedor', 'Cotizaciones Emitidas', 'Aceptadas', 'Tasa Cierre %', 'Monto Aceptado'],
      ...ranking.map(v => [
        v.vendedor,
        v.emitidas.toString(),
        v.aceptadas.toString(),
        v.tasa_cierre.toFixed(2),
        v.monto_aceptado.toFixed(0)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_vendedores_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Ranking exportado');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Vendedores</CardTitle>
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
        <CardTitle>Top Vendedores (Período)</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent>
        {ranking && ranking.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Emitidas</TableHead>
                <TableHead className="text-right">Aceptadas</TableHead>
                <TableHead className="text-right">Tasa Cierre</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((v, index) => (
                <TableRow key={v.vendedor_id}>
                  <TableCell className="font-medium">
                    {index + 1}. {v.vendedor}
                  </TableCell>
                  <TableCell className="text-right">{v.emitidas}</TableCell>
                  <TableCell className="text-right">{v.aceptadas}</TableCell>
                  <TableCell className="text-right">{v.tasa_cierre.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    ${v.monto_aceptado.toLocaleString('es-CL')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/quotes?vendedor=${v.vendedor_id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay datos de vendedores en el período seleccionado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
