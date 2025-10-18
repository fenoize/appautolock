import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NotificationVariable } from '@/types/notifications';

export function useNotificationVariables() {
  return useQuery({
    queryKey: ['notification-variables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_variables')
        .select('*')
        .order('categoria', { ascending: true })
        .order('variable', { ascending: true });
      
      if (error) throw error;
      return data as NotificationVariable[];
    }
  });
}

export function useVariablesByCategory(categoria?: string) {
  return useQuery({
    queryKey: ['notification-variables', categoria],
    queryFn: async () => {
      let query = supabase
        .from('notification_variables')
        .select('*');
      
      if (categoria) {
        query = query.eq('categoria', categoria);
      }
      
      const { data, error } = await query.order('variable', { ascending: true });
      
      if (error) throw error;
      return data as NotificationVariable[];
    },
    enabled: !!categoria
  });
}
