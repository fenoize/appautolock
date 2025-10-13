import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceWithProducts } from '@/types/services';
import { toast } from 'sonner';

export function useServices(activeOnly = true) {
  return useQuery({
    queryKey: ['services', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*, services_products(*, product:products(*))');
      
      if (activeOnly) {
        query = query.eq('activo', true);
      }
      
      const { data, error } = await query.order('nombre');
      
      if (error) throw error;
      return data as ServiceWithProducts[];
    }
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, services_products(*, product:products(*))')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ServiceWithProducts;
    },
    enabled: !!id
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('services')
        .insert([service])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear servicio');
    }
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', variables.id] });
      toast.success('Servicio actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar servicio');
    }
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: cambiar activo a false
      const { error } = await supabase
        .from('services')
        .update({ activo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio desactivado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al desactivar servicio');
    }
  });
}
