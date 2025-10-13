import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPlan } from '@/types/subscriptions';
import { toast } from 'sonner';

export function useSubscriptionPlans(activeOnly = true) {
  return useQuery({
    queryKey: ['subscription-plans', activeOnly],
    queryFn: async () => {
      let query = supabase.from('subscription_plans').select('*');
      if (activeOnly) query = query.eq('activo', true);
      
      const { data, error } = await query.order('periodo_meses');
      if (error) throw error;
      return data as any as SubscriptionPlan[];
    }
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([plan as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear plan');
    }
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar plan');
    }
  });
}

export function usePlanDetail(id: string) {
  return useQuery({
    queryKey: ['subscription-plan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any as SubscriptionPlan;
    },
    enabled: !!id
  });
}

export function useUpdatePlanNotificationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      id, 
      notificacion_config, 
      template_notificacion 
    }: { 
      id: string; 
      notificacion_config: any;
      template_notificacion: any;
    }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ 
          notificacion_config, 
          template_notificacion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Configuración de notificaciones actualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar configuración');
    }
  });
}
