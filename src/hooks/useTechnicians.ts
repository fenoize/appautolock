import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TechnicianAvailability {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  branch_id: string;
  branch_nombre?: string;
  active_work_orders: number;
  pending_count: number;
  in_progress_count: number;
  availability_status: 'disponible' | 'ocupado' | 'muy_ocupado';
}

export function useTechniciansByBranch(branchId?: string) {
  return useQuery({
    queryKey: ['technicians', branchId],
    queryFn: async () => {
      // Fetch technicians (users with 'tecnico' role)
      const { data: technicianRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'tecnico');

      if (rolesError) throw rolesError;

      const technicianIds = technicianRoles.map(r => r.user_id);

      if (technicianIds.length === 0) {
        return [];
      }

      // Fetch profiles with branch info
      let query = supabase
        .from('profiles')
        .select(`
          id,
          nombre,
          apellido,
          email,
          branch_id,
          estado,
          branches:branch_id (nombre)
        `)
        .in('id', technicianIds)
        .eq('estado', 'activo');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch work order counts for each technician
      const techniciansWithAvailability: TechnicianAvailability[] = await Promise.all(
        profiles.map(async (profile) => {
          // Count active work orders (not completed or cancelled)
          const { count: activeCount, error: activeError } = await supabase
            .from('work_orders')
            .select('*', { count: 'exact', head: true })
            .eq('tecnico_id', profile.id)
            .not('estado', 'in', '(completada,cancelada)');

          if (activeError) throw activeError;

          // Count pending work orders
          const { count: pendingCount, error: pendingError } = await supabase
            .from('work_orders')
            .select('*', { count: 'exact', head: true })
            .eq('tecnico_id', profile.id)
            .in('estado', ['asignada', 'programada']);

          if (pendingError) throw pendingError;

          // Count in-progress work orders
          const { count: inProgressCount, error: inProgressError } = await supabase
            .from('work_orders')
            .select('*', { count: 'exact', head: true })
            .eq('tecnico_id', profile.id)
            .in('estado', ['en_ruta', 'en_proceso', 'pausada']);

          if (inProgressError) throw inProgressError;

          // Determine availability status
          const active = activeCount || 0;
          let availabilityStatus: 'disponible' | 'ocupado' | 'muy_ocupado' = 'disponible';
          
          if (active >= 5) {
            availabilityStatus = 'muy_ocupado';
          } else if (active >= 2) {
            availabilityStatus = 'ocupado';
          }

          return {
            id: profile.id,
            nombre: profile.nombre,
            apellido: profile.apellido || '',
            email: profile.email,
            branch_id: profile.branch_id!,
            branch_nombre: profile.branches?.nombre,
            active_work_orders: active,
            pending_count: pendingCount || 0,
            in_progress_count: inProgressCount || 0,
            availability_status: availabilityStatus,
          };
        })
      );

      // Sort by availability (disponible first)
      return techniciansWithAvailability.sort((a, b) => {
        const statusOrder = { disponible: 0, ocupado: 1, muy_ocupado: 2 };
        return statusOrder[a.availability_status] - statusOrder[b.availability_status];
      });
    },
    enabled: true,
  });
}
