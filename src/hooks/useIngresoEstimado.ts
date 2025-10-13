import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useDashboardFilters';
import { IngresoEstimado } from '@/types/dashboard';

export function useIngresoEstimado(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['ingreso-estimado', filters],
    queryFn: async () => {
      // Sumar neto de cotizaciones aceptadas
      let query = supabase
        .from('quotes')
        .select('neto')
        .eq('estado', 'aceptada');
      
      if (filters.fecha_desde) {
        query = query.gte('fecha_emision', filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        query = query.lte('fecha_emision', filters.fecha_hasta);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const neto_estimado = data?.reduce((sum, q) => sum + (q.neto || 0), 0) || 0;
      
      return {
        neto_estimado,
        periodo: `${filters.fecha_desde} - ${filters.fecha_hasta}`,
        fuente: 'cotizaciones'
      } as IngresoEstimado;
    },
    enabled: !!filters.fecha_desde && !!filters.fecha_hasta
  });
}
