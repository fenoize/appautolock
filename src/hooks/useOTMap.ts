import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OTMapPin } from '@/types/dashboard';
import { format } from 'date-fns';

export function useOTMap(branchId?: string) {
  return useQuery({
    queryKey: ['ot-map', branchId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      let query = supabase
        .from('work_orders')
        .select(`
          id,
          folio,
          estado,
          ubicacion_lat,
          ubicacion_lng,
          ubicacion_manual,
          client:clients(razon_social, nombre_comercial)
        `)
        .gte('fecha_programada', today)
        .lt('fecha_programada', `${today}T23:59:59`)
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null)
        .limit(200);
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const pins: OTMapPin[] = data?.map(wo => ({
        id: wo.id,
        folio: wo.folio,
        estado: wo.estado,
        ubicacion_lat: wo.ubicacion_lat!,
        ubicacion_lng: wo.ubicacion_lng!,
        cliente: wo.client?.razon_social || wo.client?.nombre_comercial || 'Sin nombre',
        direccion: wo.ubicacion_manual || undefined
      })) || [];
      
      return pins;
    }
  });
}
