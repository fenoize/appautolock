import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateBackup, useListBackups, useDownloadBackup } from "@/hooks/useBackup";
import { Download, Loader2, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const BackupManager = () => {
  const createBackup = useCreateBackup();
  const { data: backups, isLoading } = useListBackups();
  const downloadBackup = useDownloadBackup();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Respaldo</CardTitle>
          <CardDescription>
            Genera un respaldo completo del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => createBackup.mutate()} 
            disabled={createBackup.isPending}
          >
            {createBackup.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Crear Respaldo Ahora
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respaldos Existentes</CardTitle>
          <CardDescription>
            Descarga respaldos anteriores del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : backups && backups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-mono text-sm">{backup.name}</TableCell>
                    <TableCell>{formatFileSize(backup.metadata?.size || 0)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(backup.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadBackup.mutate(backup.name)}
                        disabled={downloadBackup.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay respaldos disponibles
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
