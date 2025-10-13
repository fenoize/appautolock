import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { useTecnicoRanking } from '@/hooks/useTecnicoRanking';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function TecnicoRankingTable() {
  const { filters } = useDashboardFilters();
  const { data: ranking, isLoading } = useTecnicoRanking(filters);
  const navigate = useNavigate();

  const handleExport = () => {
    if (!ranking || ranking.length === 0) return;
    
    const csv = [
      ['Técnico', 'OTs Finalizadas', 'Tiempo Medio (min)', 'Reprogramadas'],
      ...ranking.map(t => [
        t.tecnico,
        t.finalizadas.toString(),
        t.tiempo_medio_min.toString(),
        t.reprogramadas.toString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_tecnicos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Ranking exportado');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Técnicos</CardTitle>
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
        <CardTitle>Top Técnicos (Período)</CardTitle>
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
                <TableHead>Técnico</TableHead>
                <TableHead className="text-right">Finalizadas</TableHead>
                <TableHead className="text-right">Tiempo Medio</TableHead>
                <TableHead className="text-right">Reprogramadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((t, index) => (
                <TableRow key={t.tecnico_id}>
                  <TableCell className="font-medium">
                    {index + 1}. {t.tecnico}
                  </TableCell>
                  <TableCell className="text-right">{t.finalizadas}</TableCell>
                  <TableCell className="text-right">{t.tiempo_medio_min} min</TableCell>
                  <TableCell className="text-right">{t.reprogramadas}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/work-orders?tecnico=${t.tecnico_id}`)}
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
            No hay datos de técnicos en el período seleccionado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
