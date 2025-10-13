import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters, TopProductService, InventoryRotation, TechnicianProductivity } from '@/types/analytics';

export const useTopProductsServices = (filters: DashboardFilters, limit = 10) => {
  return useQuery({
    queryKey: ['top-products-services', filters, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obtener_top_productos_servicios', {
        p_fecha_desde: filters.fecha_desde,
        p_fecha_hasta: filters.fecha_hasta,
        p_branch_id: filters.branch_id || null,
        p_limit: limit
      });
      if (error) throw error;
      return data as TopProductService[];
    }
  });
};

export const useInventoryRotation = (fecha_desde: string, fecha_hasta: string) => {
  return useQuery({
    queryKey: ['inventory-rotation', fecha_desde, fecha_hasta],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calcular_rotacion_inventario', {
        p_fecha_desde: fecha_desde,
        p_fecha_hasta: fecha_hasta
      });
      if (error) throw error;
      return data as InventoryRotation[];
    }
  });
};

export const useTechnicianProductivity = (filters: DashboardFilters) => {
  return useQuery({
    queryKey: ['technician-productivity', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calcular_productividad_tecnicos', {
        p_fecha_desde: filters.fecha_desde,
        p_fecha_hasta: filters.fecha_hasta,
        p_branch_id: filters.branch_id || null
      });
      if (error) throw error;
      return data as TechnicianProductivity[];
    }
  });
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
