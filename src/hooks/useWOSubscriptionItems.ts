import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WOSubscriptionItem {
  id: string;
  wo_id: string;
  item_tipo: 'servicio' | 'producto';
  ref_id?: string;
  nombre: string;
  requiere_suscripcion: boolean;
  subscription_id?: string;
  numeros_serie?: any[];
  created_at: string;
  subscription?: {
    id: string;
    folio: string;
    estado: string;
    plan?: {
      nombre: string;
    };
  };
  product?: {
    id: string;
    tipos_suscripcion_disponibles: any[];
  };
  service?: {
    id: string;
    tipos_suscripcion_disponibles: any[];
  };
}

export interface GPSData {
  modelo_gps?: string;
  imei_gps?: string;
  imei_pcs?: string;
  numero_pcs?: string;
  compania?: string;
  correo_usuario?: string;
  app_alojada?: string;
  instalador?: string;
}

// Obtener items de suscripción de una OT
export function useWOSubscriptionItems(woId: string | undefined) {
  return useQuery({
    queryKey: ['wo-subscription-items', woId],
    queryFn: async () => {
      if (!woId) return [];

      const { data, error } = await supabase
        .from('wo_subscription_items')
        .select(`
          *,
          subscription:subscriptions(
            id,
            folio,
            estado,
            plan:subscription_plans(nombre)
          )
        `)
        .eq('wo_id', woId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Obtener datos de productos y servicios manualmente
      const items = data || [];
      const enrichedItems = await Promise.all(items.map(async (item) => {
        let product = null;
        let service = null;
        
        if (item.item_tipo === 'producto' && item.ref_id) {
          const { data: prodData } = await supabase
            .from('products')
            .select('id, tipos_suscripcion_disponibles')
            .eq('id', item.ref_id)
            .single();
          product = prodData;
        }
        
        if (item.item_tipo === 'servicio' && item.ref_id) {
          const { data: servData } = await supabase
            .from('services')
            .select('id, tipos_suscripcion_disponibles')
            .eq('id', item.ref_id)
            .single();
          service = servData;
        }
        
        return {
          ...item,
          product,
          service
        };
      }));
      
      return enrichedItems as WOSubscriptionItem[];
    },
    enabled: !!woId,
  });
}

// Crear suscripción desde un item de OT
export function useCreateSubscriptionFromWOItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      woSubscriptionItemId,
      planId,
      numerosSerietext,
      fechaInicio,
      gpsData,
      woId,
    }: {
      woSubscriptionItemId: string;
      planId: string;
      numerosSerietext: any[];
      fechaInicio?: string;
      gpsData?: GPSData;
      woId?: string;
    }) => {
      // Create subscription via RPC
      const { data: subscriptionId, error } = await supabase.rpc('create_subscription_from_wo_item', {
        p_wo_subscription_item_id: woSubscriptionItemId,
        p_plan_id: planId,
        p_numeros_serie: numerosSerietext,
        p_fecha_inicio: fechaInicio || null,
      });

      if (error) throw error;

      // Update subscription with wo_id and GPS data if provided
      if (subscriptionId) {
        const updateFields: Record<string, any> = {};
        if (woId) updateFields.wo_id = woId;

        if (gpsData) {
          if (gpsData.modelo_gps) updateFields.modelo_gps = gpsData.modelo_gps;
          if (gpsData.imei_gps) updateFields.imei_gps = gpsData.imei_gps;
          if (gpsData.imei_pcs) updateFields.imei_pcs = gpsData.imei_pcs;
          if (gpsData.numero_pcs) updateFields.numero_pcs = gpsData.numero_pcs;
          if (gpsData.compania) updateFields.compania = gpsData.compania;
          if (gpsData.correo_usuario) updateFields.correo_usuario = gpsData.correo_usuario;
          if (gpsData.app_alojada) updateFields.app_alojada = gpsData.app_alojada;
          if (gpsData.instalador) updateFields.instalador = gpsData.instalador;
        }

        if (Object.keys(updateFields).length > 0) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(updateFields as any)
            .eq('id', subscriptionId);

          if (updateError) {
            console.error('Error updating subscription fields:', updateError);
          }
        }
      }

      return subscriptionId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wo-subscription-items'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Éxito",
        description: "Suscripción creada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear suscripción",
        variant: "destructive",
      });
    },
  });
}