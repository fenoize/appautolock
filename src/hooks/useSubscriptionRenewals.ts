import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionRenewal {
  id: string;
  renewed_at: string;
  fecha_anterior: string;
  fecha_nueva: string;
  renovado_por: string | null;
  subscription: {
    id: string;
    folio: string;
    estado: string | null;
    imei_gps: string | null;
    imei_pcs: string | null;
    numero_pcs: string | null;
    modelo_gps: string | null;
    compania: string | null;
    instalador: string | null;
    fecha_inicio: string | null;
    fecha_vencimiento: string | null;
    plan: { nombre: string; precio: number | null; periodo_meses: number | null } | null;
    client: {
      razon_social: string | null;
      nombre_comercial: string | null;
      email_principal: string | null;
    } | null;
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
            id,
            folio,
            estado,
            imei_gps,
            imei_pcs,
            numero_pcs,
            modelo_gps,
            compania,
            instalador,
            fecha_inicio,
            fecha_vencimiento,
            plan:subscription_plans(nombre, precio, periodo_meses),
            client:clients(razon_social, nombre_comercial, email_principal),
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

export interface RenewalHistoryEntry {
  id: string;
  renewed_at: string;
  fecha_anterior: string;
  fecha_nueva: string;
}

export function useRenewalHistory(subscriptionId?: string) {
  return useQuery<RenewalHistoryEntry[]>({
    queryKey: ['subscription-renewal-history', subscriptionId],
    enabled: !!subscriptionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_renewals')
        .select('id, renewed_at, fecha_anterior, fecha_nueva')
        .eq('subscription_id', subscriptionId!)
        .order('renewed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RenewalHistoryEntry[];
    },
  });
}
