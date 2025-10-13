import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useDashboardFilters';
import { SLAStats } from '@/types/dashboard';
import { useSettingByKey } from './useSettings';

export function useSLAStats(filters: DashboardFilters) {
  const { data: slaConfig } = useSettingByKey('sla_ot_minutos_objetivo');
  const slaMinutos = parseInt(slaConfig?.valor || '120', 10);
  
  return useQuery({
    queryKey: ['sla-stats', filters, slaMinutos],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select('id, estado, fecha_inicio_real, fecha_fin_real');
      
      if (filters.fecha_desde) {
        query = query.gte('fecha_programada', filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        query = query.lte('fecha_programada', filters.fecha_hasta);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let cumplidas = 0;
      let reprogramadas = 0;
      let atrasadas = 0;
      
      data?.forEach(wo => {
        // Reprogramadas
        if (wo.estado === 'reprogramada') {
          reprogramadas += 1;
          return;
        }
        
        // Cumplidas en hora y atrasadas (solo OTs completadas)
        if (wo.estado === 'completada' && wo.fecha_fin_real && wo.fecha_inicio_real) {
          const duracion = (new Date(wo.fecha_fin_real).getTime() - 
                           new Date(wo.fecha_inicio_real).getTime()) / 60000; // minutos
          
          if (duracion <= slaMinutos) {
            cumplidas += 1;
          } else {
            atrasadas += 1;
          }
        }
      });
      
      const total = cumplidas + reprogramadas + atrasadas;
      const porcentaje_cumplimiento = total > 0 ? (cumplidas / total) * 100 : 0;
      
      return {
        cumplidas,
        reprogramadas,
        atrasadas,
        total,
        porcentaje_cumplimiento
      } as SLAStats;
    },
    enabled: !!filters.fecha_desde && !!filters.fecha_hasta
  });
}
