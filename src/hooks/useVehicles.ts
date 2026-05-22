import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleFilters } from '@/types/vehicles';
import { toast } from 'sonner';

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select('*, clients(razon_social, nombre_comercial)')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        const { data: searchResults } = await supabase
          .rpc('search_vehicles', { search_term: filters.search });
        
        if (searchResults && searchResults.length > 0) {
          const ids = searchResults.map((r: any) => r.vehicle_id);
          query = query.in('id', ids);
        }
      }

      if (filters?.marca) {
        query = query.eq('marca', filters.marca);
      }

      if (filters?.anio) {
        query = query.eq('anio', filters.anio);
      }

      if (filters?.combustible) {
        query = query.eq('combustible', filters.combustible);
      }

      if (filters?.tipo_encendido) {
        query = query.eq('tipo_encendido', filters.tipo_encendido);
      }

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Vehicle[];
    }
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, clients(razon_social, nombre_comercial, email_principal)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!id
  });
}

export function useVehiclesByClient(clientId: string) {
  return useQuery({
    queryKey: ['vehicles', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!clientId
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicle as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehículo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear vehículo');
    }
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vehicle> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
      toast.success('Vehículo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar vehículo');
    }
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehículo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar vehículo');
    }
  });
}
