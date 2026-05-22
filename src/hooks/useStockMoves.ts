import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockMove, KardexEntry } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';

export const useStockMoves = (filters?: {
  product_id?: string;
  location_id?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
}) => {
  return useQuery({
    queryKey: ['stock-moves', filters],
    queryFn: async () => {
      let query = supabase
        .from('stock_moves')
        .select(`
          *,
          product:products(id, sku, nombre),
          from_location:stock_locations!stock_moves_from_location_id_fkey(id, nombre),
          to_location:stock_locations!stock_moves_to_location_id_fkey(id, nombre),
          user:profiles(id, nombre, apellido),
          wo:work_orders(id, folio)
        `);
      
      if (filters?.product_id) query = query.eq('product_id', filters.product_id);
      if (filters?.tipo) query = query.eq('tipo', filters.tipo as any);
      if (filters?.desde) query = query.gte('fecha', filters.desde);
      if (filters?.hasta) query = query.lte('fecha', filters.hasta);
      
      if (filters?.location_id) {
        query = query.or(`from_location_id.eq.${filters.location_id},to_location_id.eq.${filters.location_id}`);
      }
      
      const { data, error } = await query.order('fecha', { ascending: false });
      if (error) throw error;
      return data as unknown as StockMove[];
    }
  });
};

export const useKardex = (product_id: string, location_id?: string) => {
  return useQuery({
    queryKey: ['kardex', product_id, location_id],
    queryFn: async () => {
      let query = supabase
        .from('stock_moves')
        .select(`
          *,
          from_location:stock_locations!stock_moves_from_location_id_fkey(nombre),
          to_location:stock_locations!stock_moves_to_location_id_fkey(nombre),
          user:profiles(nombre, apellido)
        `)
        .eq('product_id', product_id);
      
      if (location_id) {
        query = query.or(`from_location_id.eq.${location_id},to_location_id.eq.${location_id}`);
      }
      
      const { data, error } = await query.order('fecha', { ascending: true });
      if (error) throw error;
      
      const moves = data as StockMove[];
      let saldo = 0;
      
      const kardex: KardexEntry[] = moves.map(move => {
        const entrada = move.to_location_id === location_id ? move.cantidad : 0;
        const salida = move.from_location_id === location_id ? move.cantidad : 0;
        saldo += entrada - salida;
        
        return {
          fecha: move.fecha,
          tipo: move.tipo,
          referencia: move.referencia,
          cantidad_entrada: entrada,
          cantidad_salida: salida,
          saldo,
          ubicacion: move.from_location?.nombre || move.to_location?.nombre,
          usuario: move.user ? `${move.user.nombre} ${move.user.apellido || ''}`.trim() : undefined,
          notas: move.notas
        };
      });
      
      return kardex;
    },
    enabled: !!product_id
  });
};

export const useRegistrarCompra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      product_id: string;
      location_id: string;
      cantidad: number;
      precio_costo: number;
      referencia: string;
      notas?: string;
      serials?: string[];
    }) => {
      const { data, error } = await supabase.rpc('registrar_compra_stock', {
        p_product_id: params.product_id,
        p_location_id: params.location_id,
        p_cantidad: params.cantidad,
        p_precio_costo: params.precio_costo,
        p_referencia: params.referencia,
        p_notas: params.notas,
        p_serials: params.serials
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Éxito", description: "Compra registrada correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
};

export const useTrasladarStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      product_id: string;
      from_location_id: string;
      to_location_id: string;
      cantidad: number;
      notas?: string;
      serials?: string[];
    }) => {
      const { data, error } = await supabase.rpc('trasladar_stock', {
        p_product_id: params.product_id,
        p_from_location_id: params.from_location_id,
        p_to_location_id: params.to_location_id,
        p_cantidad: params.cantidad,
        p_notas: params.notas,
        p_serials: params.serials
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
      toast({ title: "Éxito", description: "Traslado registrado correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
};

export const useAjustarStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      product_id: string;
      location_id: string;
      cantidad_nueva: number;
      razon: string;
    }) => {
      const { data, error } = await supabase.rpc('ajustar_stock', {
        p_product_id: params.product_id,
        p_location_id: params.location_id,
        p_cantidad_nueva: params.cantidad_nueva,
        p_razon: params.razon
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
      queryClient.invalidateQueries({ queryKey: ['kardex'] });
      toast({ title: "Éxito", description: "Ajuste de inventario registrado" });
    }
  });
};
