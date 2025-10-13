import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockAlert } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';

export const useStockAlerts = (resuelta?: boolean) => {
  return useQuery({
    queryKey: ['stock-alerts', resuelta],
    queryFn: async () => {
      let query = supabase
        .from('stock_alerts')
        .select('*, product:products(id, sku, nombre), location:stock_locations(id, nombre)');
      
      if (resuelta !== undefined) {
        query = query.eq('resuelta', resuelta);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as StockAlert[];
    }
  });
};

export const useResolverAlerta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('stock_alerts')
        .update({ 
          resuelta: true, 
          resuelta_at: new Date().toISOString(), 
          resuelta_por: user?.id 
        })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast({ title: "Éxito", description: "Alerta resuelta" });
    }
  });
};
