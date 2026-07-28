import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientFilters } from '@/types/clients';
import { toast } from 'sonner';

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      query = query.neq('estado', 'archivado' as any);


      if (filters?.search) {
        const { data: searchResults } = await supabase
          .rpc('search_clients', { search_term: filters.search });
        
        if (searchResults && searchResults.length > 0) {
          const ids = searchResults.map((r: any) => r.client_id);
          query = query.in('id', ids);
        }
      }

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }

      if (filters?.vendedor_id) {
        query = query.eq('vendedor_id', filters.vendedor_id);
      }

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Client[];
    }
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!id
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear cliente');
    }
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar cliente');
    }
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: cambiar estado a suspendido
      const { error } = await supabase
        .from('clients')
        .update({ estado: 'suspendido' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar cliente');
    }
  });
}
