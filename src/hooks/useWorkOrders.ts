import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkOrder, WOFilters, WOStats, WOItem, WOSubstitution, WOStatus } from '@/types/workOrders';
import { toast } from 'sonner';

export const useWorkOrders = (filters?: WOFilters) => {
  return useQuery({
    queryKey: ['work-orders', filters],
    queryFn: async () => {
      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 25;
      const from = (page - 1) * pageSize;
      const to = page * pageSize - 1;

      let query = supabase
        .from('work_orders')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*),
          tecnico:profiles(*),
          branch:branches(*),
          items:wo_items(*),
          substitutions:wo_substitutions(
            *,
            producto_original:products!wo_substitutions_producto_original_id_fkey(*),
            producto_sustituto:products!wo_substitutions_producto_sustituto_id_fkey(*)
          )
        `, { count: 'exact' });

      if (filters?.estado) query = query.eq('estado', filters.estado);
      if (filters?.tecnico_id) query = query.eq('tecnico_id', filters.tecnico_id);
      if (filters?.branch_id) query = query.eq('branch_id', filters.branch_id);
      if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde);
      if (filters?.fecha_hasta) query = query.lte('created_at', `${filters.fecha_hasta}T23:59:59`);
      if (filters?.search) {
        const s = filters.search.replace(/[%,]/g, '');
        query = query.or(`folio.ilike.%${s}%,notas.ilike.%${s}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      const total = count ?? 0;
      return {
        data: (data ?? []) as unknown as WorkOrder[],
        count: total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }
  });
};


export const useWorkOrder = (id: string) => {
  return useQuery({
    queryKey: ['work-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*),
          tecnico:profiles(*),
          branch:branches(*),
          items:wo_items(*),
          substitutions:wo_substitutions(
            *,
            producto_original:products!wo_substitutions_producto_original_id_fkey(*),
            producto_sustituto:products!wo_substitutions_producto_sustituto_id_fkey(*)
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as WorkOrder;
    },
    enabled: !!id
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: Partial<WorkOrder>) => {
      const { data: folio } = await supabase.rpc('generar_folio', { prefijo: 'OT' });
      
      const { client, vehicle, tecnico, branch, items, substitutions, ...woData } = wo;
      
      const { data, error } = await supabase
        .from('work_orders')
        .insert({ ...woData, folio, estado: 'pendiente' } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Orden de trabajo creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear OT: ${error.message}`);
    }
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkOrder> & { id: string }) => {
      const { client, vehicle, tecnico, branch, items, substitutions, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('work_orders')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.id] });
      toast.success('Orden de trabajo actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar OT: ${error.message}`);
    }
  });
};

export const useCreateWOItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<WOItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('wo_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.wo_id] });
      toast.success('Item agregado');
    }
  });
};

export const useDeleteWOItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wo_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Item eliminado');
    }
  });
};

export const useReserveInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (woId: string) => {
      const { error } = await supabase.rpc('reservar_inventario_wo', { p_wo_id: woId });
      if (error) throw error;
    },
    onSuccess: (_, woId) => {
      queryClient.invalidateQueries({ queryKey: ['work-order', woId] });
      toast.success('Inventario reservado');
    },
    onError: (error: Error) => {
      toast.error(`Error al reservar inventario: ${error.message}`);
    }
  });
};

export const useCloseWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      wo_id: string;
      checklist_data: any;
      observaciones_cierre: string;
      firma_data: string;
      firma_nombre: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('close-work-order', {
        body: payload
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('OT cerrada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al cerrar OT: ${error.message}`);
    }
  });
};

export const useUploadEvidence = () => {
  return useMutation({
    mutationFn: async ({ woId, file }: { woId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${woId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('wo-evidencias')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('wo-evidencias')
        .getPublicUrl(fileName);
      
      return publicUrl;
    },
    onSuccess: () => {
      toast.success('Evidencia subida');
    },
    onError: (error: Error) => {
      toast.error(`Error al subir evidencia: ${error.message}`);
    }
  });
};

export const useCreateSubstitution = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Omit<WOSubstitution, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('wo_substitutions')
        .insert(sub as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.wo_id] });
      toast.success('Sustitución registrada');
    }
  });
};

export const useWOStats = (filters?: WOFilters) => {
  return useQuery({
    queryKey: ['wo-stats', filters],
    queryFn: async () => {
      let query = supabase.from('work_orders').select('estado, duracion_minutos');
      
      if (filters?.tecnico_id) query = query.eq('tecnico_id', filters.tecnico_id);
      if (filters?.fecha_desde) query = query.gte('fecha_programada', filters.fecha_desde);
      if (filters?.fecha_hasta) query = query.lte('fecha_programada', filters.fecha_hasta);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const total = data.length;
      const completadas = data.filter(w => w.estado === 'completada').length;
      const en_proceso = data.filter(w => w.estado === 'en_proceso').length;
      const pendientes = data.filter(w => w.estado === 'pendiente').length;
      
      const tiempos = data.filter(w => w.duracion_minutos).map(w => w.duracion_minutos);
      const tiempo_promedio = tiempos.length > 0 
        ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length 
        : 0;
      
      const por_estado = data.reduce((acc, w) => {
        const status = w.estado as keyof typeof acc;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total_ots: total,
        completadas,
        en_proceso,
        pendientes,
        tiempo_promedio_minutos: Math.round(tiempo_promedio),
        por_estado: por_estado as Record<WOStatus, number>
      } as WOStats;
    }
  });
};
