import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const AuditLogTable = () => {
  const [filters, setFilters] = useState({
    fecha_desde: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    fecha_hasta: format(new Date(), 'yyyy-MM-dd'),
    tabla: '',
    accion: '',
  });

  const { data: logs, isLoading } = useAuditLog(filters, 100);

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'INSERT':
        return 'bg-green-500/10 text-green-500';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['Fecha', 'Usuario', 'Tabla', 'Acción', 'Registro ID'];
    const rows = logs.map(log => [
      format(new Date(log.fecha_hora), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
      log.user_nombre || 'Sistema',
      log.tabla,
      log.accion,
      log.registro_id,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={filters.fecha_desde}
                onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
              />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={filters.fecha_hasta}
                onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
              />
            </div>
            <div>
              <Label>Tabla</Label>
              <Select value={filters.tabla} onValueChange={(value) => setFilters({ ...filters, tabla: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="vehicles">Vehículos</SelectItem>
                  <SelectItem value="quotes">Cotizaciones</SelectItem>
                  <SelectItem value="work_orders">Órdenes de Trabajo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Acción</Label>
              <Select value={filters.accion} onValueChange={(value) => setFilters({ ...filters, accion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="INSERT">Crear</SelectItem>
                  <SelectItem value="UPDATE">Actualizar</SelectItem>
                  <SelectItem value="DELETE">Eliminar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={exportToCSV} variant="outline" disabled={!logs || logs.length === 0}>
              Exportar a CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bitácora de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>{log.user_nombre || 'Sistema'}</TableCell>
                    <TableCell className="font-mono text-sm">{log.tabla}</TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.accion)}>
                        {log.accion}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay registros de auditoría para los filtros seleccionados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
