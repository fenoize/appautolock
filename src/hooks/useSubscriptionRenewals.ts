import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionRenewal {
  id: string;
  renewed_at: string;
  fecha_anterior: string;
  fecha_nueva: string;
  renovado_por: string | null;
  subscription: {
    folio: string;
    plan: { nombre: string } | null;
    client: { razon_social: string | null; nombre_comercial: string | null } | null;
    vehicle: { patente: string | null; marca: string | null; modelo: string | null } | null;
  } | null;
}

export function useSubscriptionRenewals(desde?: string, hasta?: string) {
  return useQuery<SubscriptionRenewal[]>({
    queryKey: ['subscription-renewals', desde, hasta],
    queryFn: async () => {
      let q = supabase
        .from('subscription_renewals')
        .select(
          `id, renewed_at, fecha_anterior, fecha_nueva, renovado_por,
          subscription:subscriptions(
            folio,
            plan:subscription_plans(nombre),
            client:clients(razon_social, nombre_comercial),
            vehicle:vehicles(patente, marca, modelo)
          )`
        )
        .order('renewed_at', { ascending: false })
        .limit(50);

      if (desde) {
        q = q.gte('renewed_at', desde);
      }
      if (hasta) {
        q = q.lte('renewed_at', `${hasta}T23:59:59`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SubscriptionRenewal[];
    },
  });
}
