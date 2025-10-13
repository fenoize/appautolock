import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteFilters, QuoteItem, QuoteStats } from '@/types/quotes';
import { toast } from 'sonner';

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

export function useSendQuoteEmail() {
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

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  
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
      toast.success('Cotización eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar cotización');
    }
  });
}

export function useConvertQuoteToWO() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quoteId: string) => {
      const { data, error } = await supabase.rpc('convert_quote_to_wo', {
        p_quote_id: quoteId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_woId, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Cotización convertida a OT exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al convertir cotización');
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
