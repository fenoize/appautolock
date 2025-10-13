import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AuditLogEntry, AuditFilters } from '@/types/settings';

export const useAuditLog = (filters: AuditFilters, limit = 100) => {
  return useQuery({
    queryKey: ['audit-log', filters, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obtener_bitacora_auditoria', {
        p_fecha_desde: filters.fecha_desde,
        p_fecha_hasta: filters.fecha_hasta,
        p_tabla: filters.tabla || null,
        p_user_id: filters.user_id || null,
        p_accion: filters.accion || null,
        p_limit: limit
      });
      if (error) throw error;
      return data as AuditLogEntry[];
    }
  });
};
