import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Devuelve un mapa subscription_id -> última fecha de renovación (ISO string).
 * Fuente: tabla subscription_renewals (registrada por trigger y backfill).
 */
export function useLatestRenewals() {
  return useQuery({
    queryKey: ['latest-subscription-renewals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_renewals')
        .select('subscription_id, renewed_at')
        .order('renewed_at', { ascending: false })
        .limit(2000);
      if (error) throw error;

      const map = new Map<string, string>();
      for (const row of data || []) {
        if (row.subscription_id && !map.has(row.subscription_id)) {
          map.set(row.subscription_id, row.renewed_at);
        }
      }
      return map;
    },
  });
}
