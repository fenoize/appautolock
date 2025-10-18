import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NotificationCondition } from '@/types/notifications';
import { toast } from 'sonner';

export function useConditionsByTemplate(templateId?: string) {
  return useQuery({
    queryKey: ['notification-conditions', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_conditions')
        .select('*')
        .eq('template_id', templateId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as NotificationCondition[];
    },
    enabled: !!templateId
  });
}

export function useCreateCondition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (condition: Omit<NotificationCondition, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('notification_conditions')
        .insert(condition)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notification-conditions', variables.template_id] });
      toast.success('Condición creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear condición');
    }
  });
}

export function useUpdateCondition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotificationCondition> & { id: string }) => {
      const { data, error } = await supabase
        .from('notification_conditions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-conditions', data.template_id] });
      toast.success('Condición actualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar condición');
    }
  });
}

export function useDeleteCondition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, template_id }: { id: string; template_id: string }) => {
      const { error } = await supabase
        .from('notification_conditions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, template_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-conditions', data.template_id] });
      toast.success('Condición eliminada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar condición');
    }
  });
}
