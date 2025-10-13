import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockLocation } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';

export const useStockLocations = (tipo?: 'bodega' | 'camioneta') => {
  return useQuery({
    queryKey: ['stock-locations', tipo],
    queryFn: async () => {
      let query = supabase
        .from('stock_locations')
        .select('*, branch:branches(id, nombre)')
        .eq('activa', true);
      
      if (tipo) query = query.eq('tipo', tipo);
      
      const { data, error } = await query.order('nombre');
      if (error) throw error;
      return data as StockLocation[];
    }
  });
};

export const useCreateStockLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: Partial<StockLocation>) => {
      const { data, error } = await supabase
        .from('stock_locations')
        .insert(location as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-locations'] });
      toast({ title: "Éxito", description: "Ubicación creada" });
    }
  });
};
