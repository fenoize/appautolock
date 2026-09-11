import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivePlan {
  id: string;
  nombre: string;
  precio: number;
  periodo_meses: number;
}

export function useActiveSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, nombre, precio, periodo_meses')
        .eq('activo', true)
        .order('periodo_meses');
      if (error) throw error;
      return (data ?? []) as ActivePlan[];
    },
  });
}
