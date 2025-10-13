import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientContact } from '@/types/clients';
import { toast } from 'sonner';

export function useClientContacts(clientId: string) {
  return useQuery({
    queryKey: ['client-contacts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('es_principal', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ClientContact[];
    },
    enabled: !!clientId
  });
}

export function useCreateClientContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<ClientContact, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('client_contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', variables.client_id] });
      toast.success('Contacto agregado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar contacto');
    }
  });
}

export function useUpdateClientContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('client_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', data.client_id] });
      toast.success('Contacto actualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar contacto');
    }
  });
}

export function useDeleteClientContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', clientId] });
      toast.success('Contacto eliminado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar contacto');
    }
  });
}
