import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export function useDashboardStats(branchId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', branchId],
    queryFn: async () => {
      const today = new Date();
      const startToday = startOfDay(today);
      const endToday = endOfDay(today);
      const in7Days = addDays(today, 7);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Parallel queries for performance
      const [cotizaciones, ots, subs, stock, nuevosClientes, ingresosRes, mrrRes] = await Promise.all([
        // Cotizaciones abiertas
        supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['borrador', 'enviada']),
        
        // OTs hoy
        supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .gte('fecha_programada', startToday.toISOString())
          .lte('fecha_programada', endToday.toISOString()),
        
        // Suscripciones que vencen en 7 días
        supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'activa')
          .lte('fecha_vencimiento', in7Days.toISOString())
          .gte('fecha_vencimiento', today.toISOString()),
        
        // Stock crítico
        supabase
          .from('stock_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('resuelta', false),

        // Nuevos clientes del mes
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonth),

        // Ingresos del mes (OTs completadas)
        supabase
          .from('wo_items')
          .select('precio_unitario, cantidad, work_order:work_orders!inner(estado, updated_at)')
          .eq('work_order.estado', 'completada')
          .gte('work_order.updated_at', startOfMonth),

        // MRR GPS (suscripciones activas)
        supabase
          .from('subscriptions')
          .select('plan:subscription_plans(precio)')
          .eq('estado', 'activa')
      ]);

      const ingresos_mes = ingresosRes.data?.reduce(
        (sum: number, i: any) => sum + (Number(i.precio_unitario) * Number(i.cantidad)),
        0
      ) ?? 0;

      const mrr_gps = mrrRes.data?.reduce(
        (sum: number, s: any) => sum + Number(s.plan?.precio || 0),
        0
      ) ?? 0;

      return {
        cotizaciones_abiertas: cotizaciones.count || 0,
        ots_hoy: ots.count || 0,
        subscripciones_vencen: subs.count || 0,
        stock_critico: stock.count || 0,
        nuevos_clientes_mes: nuevosClientes.count || 0,
        ingresos_mes,
        mrr_gps
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
}

export function useProximasOTs(limit: number = 5) {
  return useQuery({
    queryKey: ['proximas-ots', limit],
    queryFn: async () => {
      const today = new Date();
      const tomorrow = addDays(today, 2);

      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          clients:client_id(razon_social, nombre_comercial),
          vehicles:vehicle_id(patente, marca, modelo),
          profiles:tecnico_id(nombre, apellido)
        `)
        .gte('fecha_programada', today.toISOString())
        .lte('fecha_programada', tomorrow.toISOString())
        .in('estado', ['programada', 'asignada', 'en_ruta'])
        .order('fecha_programada', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000 // Refresh every minute
  });
}
