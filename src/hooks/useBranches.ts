import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBranches() {
  return useQuery({
    queryKey: ['branches-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, nombre')
        .eq('activa', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });
}
