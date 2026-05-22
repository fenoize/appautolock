import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subscription, SubscriptionFilters, SubscriptionStats } from '@/types/subscriptions';
import { toast } from 'sonner';

export function useSubscriptions(filters?: SubscriptionFilters) {
  return useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: async () => {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*),
          plan:subscription_plans(*),
          events:subscription_events(*)
        `);
      
      if (filters?.estado) query = query.eq('estado', filters.estado);
      if (filters?.plan_id) query = query.eq('plan_id', filters.plan_id);
      if (filters?.client_id) query = query.eq('client_id', filters.client_id);
      if (filters?.vencimiento_desde) query = query.gte('fecha_vencimiento', filters.vencimiento_desde);
      if (filters?.vencimiento_hasta) query = query.lte('fecha_vencimiento', filters.vencimiento_hasta);
      
      const { data, error } = await query.order('fecha_vencimiento', { ascending: true });
      if (error) throw error;
      return data as any as Subscription[];
    }
  });
}

export function useExpiringSubscriptions(days: number = 30) {
  return useQuery({
    queryKey: ['subscriptions-expiring', days],
    queryFn: async () => {
      const now = new Date();
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          client:clients(id, razon_social, nombre_comercial, email_principal, telefonos),
          vehicle:vehicles(id, marca, modelo, patente),
          plan:subscription_plans(id, nombre, precio, periodo_meses)
        `)
        .eq('estado', 'activa')
        .gte('fecha_vencimiento', now.toISOString().slice(0, 10))
        .lte('fecha_vencimiento', until.toISOString().slice(0, 10))
        .order('fecha_vencimiento', { ascending: true });
      if (error) throw error;
      return (data || []) as any as Subscription[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*),
          plan:subscription_plans(*),
          events:subscription_events(*, user:profiles(*))
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any as Subscription;
    },
    enabled: !!id
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Partial<Subscription>) => {
      const { data: folio } = await supabase.rpc('generar_folio', { prefijo: 'SUS' });
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...sub, folio, estado: 'activa' } as any)
        .select()
        .single();
      if (error) throw error;
      
      await supabase
        .from('subscription_events')
        .insert({
          subscription_id: data.id,
          tipo: 'alta',
          notas: 'Suscripción creada'
        });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Suscripción creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear suscripción');
    }
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase.rpc('renovar_suscripcion', { 
        p_subscription_id: subscriptionId 
      });
      if (error) throw error;
    },
    onSuccess: (_, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      toast.success('Suscripción renovada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al renovar suscripción');
    }
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas?: string }) => {
      const { error } = await supabase.rpc('pausar_suscripcion', {
        p_subscription_id: id,
        p_notas: notas
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.id] });
      toast.success('Suscripción pausada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al pausar suscripción');
    }
  });
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase.rpc('reactivar_suscripcion', {
        p_subscription_id: subscriptionId
      });
      if (error) throw error;
    },
    onSuccess: (_, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      toast.success('Suscripción reactivada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al reactivar suscripción');
    }
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas?: string }) => {
      const { error } = await supabase.rpc('cancelar_suscripcion', {
        p_subscription_id: id,
        p_notas: notas
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.id] });
      toast.success('Suscripción cancelada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cancelar suscripción');
    }
  });
}

export function useSubscriptionStats(filters?: SubscriptionFilters) {
  return useQuery({
    queryKey: ['subscription-stats', filters],
    queryFn: async () => {
      let query = supabase.from('subscriptions').select('estado, plan:subscription_plans(precio)');
      
      if (filters?.client_id) query = query.eq('client_id', filters.client_id);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const total = data.length;
      const activas = data.filter(s => s.estado === 'activa').length;
      const en_mora = data.filter(s => s.estado === 'mora').length;
      const suspendidas = data.filter(s => s.estado === 'suspendida').length;
      const canceladas = data.filter(s => s.estado === 'cancelada').length;
      
      const ingresos = data
        .filter(s => s.estado === 'activa')
        .reduce((sum, s: any) => sum + (s.plan?.precio || 0), 0);
      
      const { data: proximas30d } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('estado', 'activa')
        .gte('fecha_vencimiento', new Date().toISOString())
        .lte('fecha_vencimiento', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      
      const { data: proximas7d } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('estado', 'activa')
        .gte('fecha_vencimiento', new Date().toISOString())
        .lte('fecha_vencimiento', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
      
      return {
        total,
        activas,
        en_mora,
        suspendidas,
        canceladas,
        renovaciones_proximas_30d: proximas30d?.length || 0,
        renovaciones_proximas_7d: proximas7d?.length || 0,
        ingresos_mensuales_estimados: ingresos
      } as SubscriptionStats;
    }
  });
}
