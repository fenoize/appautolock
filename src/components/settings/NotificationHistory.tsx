import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const NotificationHistory = () => {
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
    }
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'enviada':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Enviada
          </Badge>
        );
      case 'fallida':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Fallida
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
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
        <CardDescription>
          Últimas 100 notificaciones enviadas por el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Destinatario</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(notif.created_at).toLocaleString('es-CL')}
                  </TableCell>
                  <TableCell className="font-medium">{notif.evento}</TableCell>
                  <TableCell>{notif.destinatario}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Mail className="h-3 w-3" />
                      {notif.canal}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(notif.estado)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
