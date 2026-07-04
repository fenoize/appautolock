import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationSystemStatus = () => {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-status'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [pending, sentToday, failed] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('notifications').select('id', { count: 'exact', head: true })
          .eq('estado', 'enviado').gte('created_at', today.toISOString()),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('estado', 'fallido'),
      ]);

      return {
        pending: pending.count ?? 0,
        sentToday: sentToday.count ?? 0,
        failed: failed.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  const runNow = async () => {
    setRunning(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('process-notifications', { body: {} });
      if (error) throw error;
      toast.success(`Cola procesada: ${res?.processed ?? 0} enviadas, ${res?.failed ?? 0} fallidas`);
      qc.invalidateQueries({ queryKey: ['notifications-status'] });
      qc.invalidateQueries({ queryKey: ['notifications-history'] });
    } catch (e: any) {
      toast.error(e.message || 'Error al ejecutar procesamiento');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Estado del sistema de notificaciones</CardTitle>
          <CardDescription>Cola de envíos y procesamiento automático diario</CardDescription>
        </div>
        <Button onClick={runNow} disabled={running || isLoading} size="sm">
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          Ejecutar ahora
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{data?.pending ?? 0}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </div>
          <div className="rounded-lg border p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{data?.sentToday ?? 0}</p>
              <p className="text-sm text-muted-foreground">Enviadas hoy</p>
            </div>
          </div>
          <div className="rounded-lg border p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{data?.failed ?? 0}</p>
              <p className="text-sm text-muted-foreground">Fallidas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
