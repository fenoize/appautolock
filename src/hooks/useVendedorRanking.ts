import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useDashboardFilters';
import { VendedorRanking } from '@/types/dashboard';

export function useVendedorRanking(filters: DashboardFilters, limit: number = 5) {
  return useQuery({
    queryKey: ['vendedor-ranking', filters, limit],
    queryFn: async () => {
      // Query base: obtener cotizaciones del período
      let query = supabase
        .from('quotes')
        .select(`
          vendedor_id,
          estado,
          neto,
          vendedor:profiles!quotes_vendedor_id_fkey(id, nombre, apellido)
        `);
      
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
      
      // Agrupar por vendedor y calcular stats
      const grouped = data?.reduce((acc, quote) => {
        const vendedorId = quote.vendedor_id;
        if (!vendedorId) return acc;
        
        if (!acc[vendedorId]) {
          acc[vendedorId] = {
            vendedor_id: vendedorId,
            vendedor: quote.vendedor 
              ? `${quote.vendedor.nombre} ${quote.vendedor.apellido || ''}`.trim()
              : 'Sin nombre',
            emitidas: 0,
            aceptadas: 0,
            monto_aceptado: 0,
            tasa_cierre: 0
          };
        }
        
        // Contar emitidas (estados: 'enviada', 'aceptada')
        if (['enviada', 'aceptada'].includes(quote.estado)) {
          acc[vendedorId].emitidas += 1;
        }
        
        // Contar aceptadas y sumar monto
        if (quote.estado === 'aceptada') {
          acc[vendedorId].aceptadas += 1;
          acc[vendedorId].monto_aceptado += quote.neto || 0;
        }
        
        return acc;
      }, {} as Record<string, VendedorRanking>);
      
      // Convertir a array, calcular tasa de cierre, ordenar y limitar
      const rankings: VendedorRanking[] = Object.values(grouped || {})
        .map(v => ({
          ...v,
          tasa_cierre: v.emitidas > 0 ? (v.aceptadas / v.emitidas) * 100 : 0
        }))
        .sort((a, b) => b.monto_aceptado - a.monto_aceptado)
        .slice(0, limit);
      
      return rankings;
    },
    enabled: !!filters.fecha_desde && !!filters.fecha_hasta
  });
}
