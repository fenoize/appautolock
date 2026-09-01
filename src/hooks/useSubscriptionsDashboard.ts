import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DashboardPeriod = 'mes' | '3meses' | 'anio';

export interface DashboardSubscription {
  id: string;
  folio: string;
  estado: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  plan_id: string;
  plan?: { id: string; nombre: string; precio: number } | null;
  client?: { id: string; razon_social?: string | null; nombre_comercial?: string | null; email_principal?: string | null } | null;
  vehicle?: { id: string; patente?: string | null; marca?: string | null; modelo?: string | null } | null;
}

export function periodRange(period: DashboardPeriod) {
  const now = new Date();
  let start: Date;
  if (period === 'mes') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === '3meses') start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  else start = new Date(now.getFullYear(), 0, 1);

  const spanMs = now.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - spanMs);
  return { start, prevStart, prevEnd: start, now };
}

export function useSubscriptionsDashboardData() {
  return useQuery({
    queryKey: ['dashboard_suscripciones'],
    queryFn: async () => {
    const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, folio, estado, fecha_inicio, fecha_vencimiento, plan_id,
          plan:subscription_plans(id, nombre, precio),
          client:clients(id, razon_social, nombre_comercial, email_principal),
          vehicle:vehicles(id, patente, marca, modelo)
        `)
        .limit(5000);
      if (error) throw error;
      return (data || []) as any as DashboardSubscription[];
    },
    staleTime: 60 * 1000,
  });
}
