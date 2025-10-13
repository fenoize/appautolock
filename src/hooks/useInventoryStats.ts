import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryStats } from '@/types/inventory';

export const useInventoryStats = () => {
  return useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { count: total_productos } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);
      
      const { count: ubicaciones_activas } = await supabase
        .from('stock_locations')
        .select('*', { count: 'exact', head: true })
        .eq('activa', true);
      
      const { count: alertas_pendientes } = await supabase
        .from('stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resuelta', false);
      
      const { data: stockData } = await supabase
        .from('stock_by_location')
        .select('product_id, stock_actual, stock_minimo');
      
      const productos_sin_stock = new Set(
        stockData?.filter(s => s.stock_actual <= 0).map(s => s.product_id)
      ).size;
      
      const productos_bajo_minimo = new Set(
        stockData?.filter(s => s.stock_actual > 0 && s.stock_actual < s.stock_minimo).map(s => s.product_id)
      ).size;
      
      let valor_total_inventario: number | undefined;
      try {
        const { data: productos } = await supabase
          .from('products')
          .select('id, precio_costo');
        
        if (productos && productos[0]?.precio_costo !== undefined) {
          const { data: stocks } = await supabase
            .from('stock_by_location')
            .select('product_id, stock_actual');
          
          valor_total_inventario = stocks?.reduce((sum, s) => {
            const producto = productos.find(p => p.id === s.product_id);
            return sum + (producto?.precio_costo || 0) * s.stock_actual;
          }, 0);
        }
      } catch (error) {
        valor_total_inventario = undefined;
      }
      
      return {
        total_productos: total_productos || 0,
        productos_activos: total_productos || 0,
        ubicaciones_activas: ubicaciones_activas || 0,
        alertas_pendientes: alertas_pendientes || 0,
        valor_total_inventario,
        productos_sin_stock,
        productos_bajo_minimo
      } as InventoryStats;
    }
  });
};
