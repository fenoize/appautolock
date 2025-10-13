import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientAddress } from '@/types/clients';
import { toast } from 'sonner';

export function useClientAddresses(clientId: string) {
  return useQuery({
    queryKey: ['client-addresses', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', clientId)
        .order('es_predeterminada', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ClientAddress[];
    },
    enabled: !!clientId
  });
}

export function useCreateClientAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<ClientAddress, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('client_addresses')
        .insert([address])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', variables.client_id] });
      toast.success('Dirección agregada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar dirección');
    }
  });
}

export function useUpdateClientAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientAddress> & { id: string }) => {
      const { data, error } = await supabase
        .from('client_addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', data.client_id] });
      toast.success('Dirección actualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar dirección');
    }
  });
}

export function useDeleteClientAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', clientId] });
      toast.success('Dirección eliminada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar dirección');
    }
  });
}
