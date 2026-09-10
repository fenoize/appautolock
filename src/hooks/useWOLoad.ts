import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWOLoad() {
  return useQuery({
    queryKey: ['wo-load-next-14'],
    queryFn: async () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + 13);

      const { data, error } = await supabase
        .from('work_orders')
        .select('fecha_programada')
        .not('estado', 'in', '(completada,cancelada)')
        .gte('fecha_programada', today.toISOString().split('T')[0])
        .lte('fecha_programada', end.toISOString().split('T')[0]);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data ?? []).forEach((wo: any) => {
        const d = (wo.fecha_programada as string)?.split('T')[0] ?? wo.fecha_programada;
        if (d) counts[d] = (counts[d] || 0) + 1;
      });
      return counts;
    },
    staleTime: 1000 * 60 * 5,
  });
}
