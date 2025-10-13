import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useDashboardFilters';
import { TecnicoRanking } from '@/types/dashboard';

export function useTecnicoRanking(filters: DashboardFilters, limit: number = 5) {
  return useQuery({
    queryKey: ['tecnico-ranking', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select(`
          tecnico_id,
          estado,
          fecha_inicio_real,
          fecha_fin_real,
          tecnico:profiles!work_orders_tecnico_id_fkey(id, nombre, apellido)
        `);
      
      if (filters.fecha_desde) {
        query = query.gte('fecha_programada', filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        query = query.lte('fecha_programada', filters.fecha_hasta);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      // Filtrar solo OTs con técnico asignado
      query = query.not('tecnico_id', 'is', null);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Agrupar por técnico
      const grouped = data?.reduce((acc, wo) => {
        const tecnicoId = wo.tecnico_id!;
        if (!acc[tecnicoId]) {
          acc[tecnicoId] = {
            tecnico_id: tecnicoId,
            tecnico: wo.tecnico 
              ? `${wo.tecnico.nombre} ${wo.tecnico.apellido || ''}`.trim()
              : 'Sin nombre',
            finalizadas: 0,
            reprogramadas: 0,
            tiempo_medio_min: 0,
            tiempos: [] as number[]
          };
        }
        
        // Contar finalizadas (estado 'completada')
        if (wo.estado === 'completada') {
          acc[tecnicoId].finalizadas += 1;
          
          // Calcular duración si existen ambas fechas
          if (wo.fecha_fin_real && wo.fecha_inicio_real) {
            const duracion = (new Date(wo.fecha_fin_real).getTime() - 
                             new Date(wo.fecha_inicio_real).getTime()) / 60000; // minutos
            acc[tecnicoId].tiempos.push(duracion);
          }
        }
        
        // Contar reprogramadas
        if (wo.estado === 'reprogramada') {
          acc[tecnicoId].reprogramadas += 1;
        }
        
        return acc;
      }, {} as Record<string, TecnicoRanking & { tiempos: number[] }>);
      
      // Calcular tiempo medio y ordenar
      const rankings: TecnicoRanking[] = Object.values(grouped || {})
        .map(t => ({
          tecnico_id: t.tecnico_id,
          tecnico: t.tecnico,
          finalizadas: t.finalizadas,
          reprogramadas: t.reprogramadas,
          tiempo_medio_min: t.tiempos.length > 0 
            ? Math.round(t.tiempos.reduce((a, b) => a + b, 0) / t.tiempos.length)
            : 0
        }))
        .sort((a, b) => {
          // Ordenar por finalizadas DESC, luego por tiempo medio ASC
          if (b.finalizadas !== a.finalizadas) {
            return b.finalizadas - a.finalizadas;
          }
          return a.tiempo_medio_min - b.tiempo_medio_min;
        })
        .slice(0, limit);
      
      return rankings;
    },
    enabled: !!filters.fecha_desde && !!filters.fecha_hasta
  });
}
