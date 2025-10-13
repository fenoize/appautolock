import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters } from './useDashboardFilters';
import { TopItem } from '@/types/dashboard';

export function useTopServicios(filters: DashboardFilters, limit: number = 5) {
  return useQuery({
    queryKey: ['top-servicios', filters, limit],
    queryFn: async () => {
      // Obtener wo_items de tipo servicio
      let query = supabase
        .from('wo_items')
        .select(`
          ref_id,
          nombre,
          cantidad,
          precio_unitario,
          wo_id,
          work_order:work_orders!wo_items_wo_id_fkey(fecha_programada, branch_id)
        `)
        .eq('item_tipo', 'servicio')
        .not('ref_id', 'is', null);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrar por período y branch (en client-side por nested relation)
      const filtered = data?.filter(item => {
        const wo = item.work_order;
        if (!wo) return false;
        
        if (filters.fecha_desde && wo.fecha_programada < filters.fecha_desde) return false;
        if (filters.fecha_hasta && wo.fecha_programada > filters.fecha_hasta) return false;
        if (filters.branch_id && wo.branch_id !== filters.branch_id) return false;
        
        return true;
      });
      
      // Agrupar por ref_id
      const grouped = filtered?.reduce((acc, item) => {
        const id = item.ref_id!;
        if (!acc[id]) {
          acc[id] = {
            id,
            nombre: item.nombre,
            qty_total: 0,
            monto_total: 0
          };
        }
        
        acc[id].qty_total += item.cantidad || 0;
        acc[id].monto_total += (item.cantidad || 0) * (item.precio_unitario || 0);
        
        return acc;
      }, {} as Record<string, TopItem>);
      
      // Ordenar y limitar
      const top: TopItem[] = Object.values(grouped || {})
        .sort((a, b) => b.qty_total - a.qty_total)
        .slice(0, limit);
      
      return top;
    },
    enabled: !!filters.fecha_desde && !!filters.fecha_hasta
  });
}

export function useTopProductos(filters: DashboardFilters, limit: number = 5) {
  return useQuery({
    queryKey: ['top-productos', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('wo_items')
        .select(`
          ref_id,
          nombre,
          cantidad,
          precio_unitario,
          wo_id,
          work_order:work_orders!wo_items_wo_id_fkey(fecha_programada, branch_id)
        `)
        .eq('item_tipo', 'producto')
        .not('ref_id', 'is', null);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrar por período y branch
      const filtered = data?.filter(item => {
        const wo = item.work_order;
        if (!wo) return false;
        
        if (filters.fecha_desde && wo.fecha_programada < filters.fecha_desde) return false;
        if (filters.fecha_hasta && wo.fecha_programada > filters.fecha_hasta) return false;
        if (filters.branch_id && wo.branch_id !== filters.branch_id) return false;
        
        return true;
      });
      
      // Agrupar
      const grouped = filtered?.reduce((acc, item) => {
        const id = item.ref_id!;
        if (!acc[id]) {
          acc[id] = {
            id,
            nombre: item.nombre,
            qty_total: 0,
            monto_total: 0
          };
        }
        
        acc[id].qty_total += item.cantidad || 0;
        acc[id].monto_total += (item.cantidad || 0) * (item.precio_unitario || 0);
        
        return acc;
      }, {} as Record<string, TopItem>);
      
      const top: TopItem[] = Object.values(grouped || {})
        .sort((a, b) => b.qty_total - a.qty_total)
        .slice(0, limit);
      
      return top;
    },
    enabled: !!filters.fecha_desde && !!filters.fecha_hasta
  });
}
