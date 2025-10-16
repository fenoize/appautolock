import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteFilters, QuoteItem, QuoteStats } from '@/types/quotes';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*),
          vendedor:profiles!vendedor_id(*),
          branch:branches(*),
          items:quote_items(*)
        `);
      
      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }
      
      if (filters?.vendedor_id) {
        query = query.eq('vendedor_id', filters.vendedor_id);
      }
      
      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      if (filters?.search) {
        query = query.or(`folio.ilike.%${filters.search}%`);
      }
      
      if (filters?.fecha_desde) {
        query = query.gte('fecha_emision', filters.fecha_desde);
      }
      
      if (filters?.fecha_hasta) {
        query = query.lte('fecha_emision', filters.fecha_hasta);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Quote[];
    }
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*),
          vendedor:profiles!vendedor_id(*),
          branch:branches(*),
          items:quote_items(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Quote;
    },
    enabled: !!id
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quote: { 
      client_id: string; 
      vendedor_id: string; 
      branch_id: string;
      validez_dias?: number;
      notas?: string;
    }) => {
      // Generar folio
      const { data: folio, error: folioError } = await supabase
        .rpc('generar_folio', { prefijo: 'COT' });
      
      if (folioError) throw folioError;
      
      const { data, error } = await supabase
        .from('quotes')
        .insert([{ 
          ...quote, 
          folio,
          validez_dias: quote.validez_dias || 30,
          estado: 'borrador' as const
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear cotización');
    }
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quote> & { id: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', variables.id] });
      toast.success('Cotización actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar cotización');
    }
  });
}

export function useCreateQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: {
      quote_id: string;
      item_tipo: 'servicio' | 'producto';
      ref_id?: string;
      nombre: string;
      descripcion?: string;
      cantidad: number;
      precio_unitario: number;
      descuento_porcentaje?: number;
    }) => {
      const subtotal = item.cantidad * item.precio_unitario * (1 - (item.descuento_porcentaje || 0) / 100);
      
      const { data, error} = await supabase
        .from('quote_items')
        .insert([{ ...item, subtotal }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar item');
    }
  });
}

export function useUpdateQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuoteItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('quote_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar item');
    }
  });
}

export function useDeleteQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quote_id }: { id: string; quote_id: string }) => {
      const { error } = await supabase
        .from('quote_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { quote_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Item eliminado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar item');
    }
  });
}

export function useGenerateQuotePDF() {
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quote_id: quoteId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('PDF generado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al generar PDF');
    }
  });
}

export function useSendQuoteEmailWithRecipient() {
  return useMutation({
    mutationFn: async ({ quoteId, email }: { quoteId: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: { quote_id: quoteId, recipient_email: email }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Email enviado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar email');
    }
  });
}

export function useApproveQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.functions.invoke('approve-quote', {
        body: { quote_id: quoteId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización aprobada y convertida a OT');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al aprobar cotización');
    }
  });
}

export function useSendQuoteEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .update({ estado: 'enviada' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización enviada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al enviar cotización');
    }
  });
}

export function useCancelQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { error } = await supabase
        .from('quotes')
        .update({ estado: 'cancelada', notas: motivo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización cancelada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al cancelar');
    }
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización eliminada');
      navigate('/quotes');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar');
    }
  });
}

export function useConvertQuoteToWO() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('convert_quote_to_wo_v2', {
        p_quote_id: quoteId
      });
      
      if (error) throw error;
      return data as string;
    },
    onSuccess: (woId: string, quoteId: string) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Cotización convertida a OT exitosamente');
      navigate(`/work-orders/${woId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al convertir cotización');
    }
  });
}

// Aprobar cotización manualmente
export function useApproveQuoteManually() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quoteId, comprobantePagoUrl }: { quoteId: string; comprobantePagoUrl?: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({
          estado: 'aceptada',
          comprobante_pago_url: comprobantePagoUrl,
          metodo_aprobacion: 'manual',
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización aprobada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al aprobar cotización');
    },
  });
}

// Rechazar cotización
export function useRejectQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quoteId, motivo }: { quoteId: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({
          estado: 'rechazada',
          notas: motivo,
        })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización rechazada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al rechazar cotización');
    },
  });
}

// Marcar como en revisión
export function useMarkQuoteInReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({ estado: 'en_revision' })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización marcada como en revisión');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar estado');
    },
  });
}

export function useAssignVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quoteId, vehicleId }: { quoteId: string; vehicleId: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update({ vehicle_id: vehicleId })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', variables.quoteId] });
      toast.success('Vehículo asignado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar vehículo');
    }
  });
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (originalId: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('quotes')
        .select('*, items:quote_items(*)')
        .eq('id', originalId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Generar folio
      const { data: folio, error: folioError } = await supabase
        .rpc('generar_folio', { prefijo: 'COT' });
      
      if (folioError) throw folioError;

      // Crear nueva cotización
      const { data: newQuote, error: createError } = await supabase
        .from('quotes')
        .insert([{
          folio,
          client_id: original.client_id,
          vehicle_id: original.vehicle_id,
          branch_id: original.branch_id,
          vendedor_id: user.id,
          validez_dias: original.validez_dias,
          estado: 'borrador' as const,
          notas: `Duplicado de ${original.folio}`,
        }])
        .select()
        .single();

      if (createError) throw createError;
      
      // Copiar items
      if (original.items && original.items.length > 0) {
        const itemsToInsert = original.items.map((item: any) => {
          const subtotal = item.cantidad * item.precio_unitario * (1 - (item.descuento_porcentaje || 0) / 100);
          return {
            quote_id: newQuote.id,
            item_tipo: item.item_tipo,
            ref_id: item.ref_id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento_porcentaje: item.descuento_porcentaje || 0,
            subtotal: Math.round(subtotal),
          };
        });
        
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }
      
      return newQuote;
    },
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización duplicada');
      navigate(`/quotes/${newQuote.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al duplicar cotización');
    }
  });
}

export function useQuoteStats(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quote-stats', filters],
    queryFn: async () => {
      let query = supabase.from('quotes').select('estado, total');
      
      if (filters?.vendedor_id) {
        query = query.eq('vendedor_id', filters.vendedor_id);
      }
      
      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      
      if (filters?.fecha_desde) {
        query = query.gte('fecha_emision', filters.fecha_desde);
      }
      
      if (filters?.fecha_hasta) {
        query = query.lte('fecha_emision', filters.fecha_hasta);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const total = data.length;
      const aceptadas = data.filter(q => q.estado === 'aceptada').length;
      const ticket_promedio = total > 0 
        ? data.reduce((sum, q) => sum + (q.total || 0), 0) / total 
        : 0;
      
      const por_estado: Record<string, number> = {};
      data.forEach(q => {
        const estado = q.estado as string;
        por_estado[estado] = (por_estado[estado] || 0) + 1;
      });
      
      return {
        total_cotizaciones: total,
        tasa_cierre: total > 0 ? (aceptadas / total) * 100 : 0,
        ticket_promedio,
        por_estado: por_estado as any
      } as QuoteStats;
    }
  });
}
