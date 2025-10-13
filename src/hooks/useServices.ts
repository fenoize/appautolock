import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Service, 
  ServiceFilters, 
  ServiceProduct, 
  ServiceChecklistItem, 
  ServiceCompatRule,
  ServiceUsageStats,
  ServiceComplete,
  ServiceWithProducts
} from '@/types/services';
import { toast } from 'sonner';

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*, services_products(*, product:products(*))');
      
      if (filters?.search) {
        query = query.or(`nombre.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
      }
      
      if (filters?.activo !== undefined) {
        query = query.eq('activo', filters.activo);
      }
      
      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      if (filters?.solo_cotizable_externo !== undefined) {
        query = query.eq('solo_cotizable_externo', filters.solo_cotizable_externo);
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
    mutationFn: async (service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'version'>) => {
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
      const { error } = await supabase
        .from('services')
        .update({ activo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio desactivado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al desactivar servicio');
    }
  });
}

// Hook para checklist items
export function useServiceChecklistItems(serviceId: string) {
  return useQuery({
    queryKey: ['service-checklist-items', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_checklist_items')
        .select('*')
        .eq('service_id', serviceId)
        .order('orden');
      
      if (error) throw error;
      return data as ServiceChecklistItem[];
    },
    enabled: !!serviceId
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<ServiceChecklistItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('service_checklist_items')
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-checklist-items', variables.service_id] });
      toast.success('Ítem agregado al checklist');
    }
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, serviceId, ...updates }: Partial<ServiceChecklistItem> & { id: string; serviceId: string }) => {
      const { data, error } = await supabase
        .from('service_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-checklist-items', variables.serviceId] });
      toast.success('Checklist actualizado');
    }
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string }) => {
      const { error } = await supabase
        .from('service_checklist_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-checklist-items', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['service-complete', variables.serviceId] });
      toast.success('Ítem eliminado');
    }
  });
}

// Hooks para gestionar productos de servicios
export function useServiceProducts(serviceId: string) {
  return useQuery({
    queryKey: ['service-products', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_products')
        .select('*, product:products(id, nombre, sku, precio_venta, serializable)')
        .eq('service_id', serviceId);
      
      if (error) throw error;
      return data as ServiceProduct[];
    },
    enabled: !!serviceId
  });
}

export function useCreateServiceProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<ServiceProduct, 'id' | 'created_at' | 'product'>) => {
      const { data, error } = await supabase
        .from('services_products')
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', variables.service_id] });
      queryClient.invalidateQueries({ queryKey: ['service-complete', variables.service_id] });
      toast.success('Material agregado');
    }
  });
}

export function useUpdateServiceProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, serviceId, ...updates }: Partial<ServiceProduct> & { id: string; serviceId: string }) => {
      const { data, error } = await supabase
        .from('services_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['service-complete', variables.serviceId] });
      toast.success('Material actualizado');
    }
  });
}

export function useDeleteServiceProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string }) => {
      const { error } = await supabase
        .from('services_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-products', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['service-complete', variables.serviceId] });
      toast.success('Material eliminado');
    }
  });
}

// Hook para reglas de compatibilidad
export function useServiceCompatRules(serviceId: string) {
  return useQuery({
    queryKey: ['service-compat-rules', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_compat_rules')
        .select('*')
        .eq('service_id', serviceId);
      
      if (error) throw error;
      return data as ServiceCompatRule[];
    },
    enabled: !!serviceId
  });
}

export function useCreateCompatRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: Omit<ServiceCompatRule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('service_compat_rules')
        .insert([rule])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-compat-rules', variables.service_id] });
      toast.success('Regla de compatibilidad agregada');
    }
  });
}

export function useDeleteCompatRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, serviceId }: { id: string; serviceId: string }) => {
      const { error } = await supabase
        .from('service_compat_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-compat-rules', variables.serviceId] });
      toast.success('Regla eliminada');
    }
  });
}

// Hook para validar compatibilidad
export function useCheckServiceCompatibility() {
  return useMutation({
    mutationFn: async ({ vehicleId, serviceId }: { vehicleId: string; serviceId: string }) => {
      const { data, error } = await supabase.rpc('is_service_compatible', {
        p_vehicle_id: vehicleId,
        p_service_id: serviceId
      });
      
      if (error) throw error;
      return data as boolean;
    }
  });
}

// Hook para stats de uso
export function useServiceUsageStats(serviceId: string) {
  return useQuery({
    queryKey: ['service-usage-stats', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_usage_stats')
        .select('*')
        .eq('service_id', serviceId)
        .maybeSingle();
      
      if (error) throw error;
      
      return data || {
        service_id: serviceId,
        ots_periodo: 0,
        tiempo_promedio_real_min: 0,
        reprogramadas: 0,
        ftf_pct: 0
      } as ServiceUsageStats;
    },
    enabled: !!serviceId
  });
}

// Hook para servicios completos (con relaciones)
export function useServiceComplete(id: string) {
  return useQuery({
    queryKey: ['service-complete', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          branch:branches(id, nombre),
          services_products(*, product:products(id, nombre, sku, precio_venta, serializable)),
          service_checklist_items(*),
          service_compat_rules(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as any as ServiceComplete;
    },
    enabled: !!id
  });
}

// Hook para top servicios (reportes)
export function useTopServices(filters?: { 
  desde?: string; 
  hasta?: string; 
  branch_id?: string;
  orderBy?: 'cantidad' | 'monto';
  limit?: number;
}) {
  return useQuery({
    queryKey: ['top-services', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obtener_top_servicios', {
        p_fecha_desde: filters?.desde || '2024-01-01',
        p_fecha_hasta: filters?.hasta || new Date().toISOString().split('T')[0],
        p_branch_id: filters?.branch_id || null,
        p_order_by: filters?.orderBy || 'cantidad',
        p_limit: filters?.limit || 5
      });
      
      if (error) throw error;
      return data;
    }
  });
}
