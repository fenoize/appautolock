import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, CheckCircle2, XCircle, Clock, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationHistory = () => {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const retry = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ estado: 'pendiente', error_message: null })
      .eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Notificación re-encolada');
    qc.invalidateQueries({ queryKey: ['notifications-history'] });
    qc.invalidateQueries({ queryKey: ['notifications-status'] });
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'enviada':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Enviada</Badge>;
      case 'fallida':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Fallida</Badge>;
      case 'pendiente':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Notificaciones</CardTitle>
        <CardDescription>Últimas 100 notificaciones registradas por el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creada</TableHead>
              <TableHead>Enviada</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications && notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <TableRow key={notif.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(notif.created_at).toLocaleString('es-CL')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {notif.enviado_at ? new Date(notif.enviado_at).toLocaleString('es-CL') : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{notif.evento}</TableCell>
                  <TableCell>{notif.destinatario}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Mail className="h-3 w-3" />{notif.canal}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(notif.estado)}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-red-600" title={notif.error_message || ''}>
                    {notif.estado === 'fallida' ? notif.error_message || 'Error desconocido' : ''}
                  </TableCell>
                  <TableCell className="text-right">
                    {notif.estado === 'fallida' && (
                      <Button size="sm" variant="outline" onClick={() => retry(notif.id)}>
                        <RotateCw className="h-3 w-3 mr-1" />Reintentar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay notificaciones registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
