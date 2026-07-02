import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockCriticoItem {
  id: string;
  product_name: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface GpsPorVencerItem {
  id: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  cliente: string;
  patente: string;
}

export interface OtSinTecnicoItem {
  id: string;
  folio: string;
  created_at: string;
  horas: number;
}

export function useSystemAlerts() {
  return useQuery({
    queryKey: ['system-alerts'],
    refetchInterval: 2 * 60 * 1000,
    queryFn: async () => {
      const now = new Date();
      const in7d = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
      const since24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

      const [stockRes, gpsRes, otsRes] = await Promise.all([
        supabase
          .from('stock_alerts')
          .select('id, stock_actual, stock_minimo, products(nombre)')
          .eq('resuelta', false)
          .limit(8),
        supabase
          .from('subscriptions')
          .select('id, fecha_vencimiento, clients(razon_social), vehicles(patente)')
          .eq('estado', 'activa')
          .gte('fecha_vencimiento', now.toISOString())
          .lte('fecha_vencimiento', in7d)
          .order('fecha_vencimiento', { ascending: true })
          .limit(8),
        supabase
          .from('work_orders')
          .select('id, folio, created_at')
          .eq('estado', 'pendiente')
          .is('tecnico_id', null)
          .lt('created_at', since24h)
          .order('created_at', { ascending: true })
          .limit(8),
      ]);

      const stockCritico: StockCriticoItem[] = (stockRes.data ?? []).map((r: any) => ({
        id: r.id,
        product_name: r.products?.nombre ?? 'Producto',
        stock_actual: r.stock_actual,
        stock_minimo: r.stock_minimo,
      }));

      const gpsPorVencer: GpsPorVencerItem[] = (gpsRes.data ?? []).map((s: any) => ({
        id: s.id,
        fecha_vencimiento: s.fecha_vencimiento,
        dias_restantes: Math.ceil(
          (new Date(s.fecha_vencimiento).getTime() - Date.now()) / 86400000
        ),
        cliente: s.clients?.razon_social ?? 'Cliente',
        patente: s.vehicles?.patente ?? '',
      }));

      const otsSinTecnico: OtSinTecnicoItem[] = (otsRes.data ?? []).map((wo: any) => ({
        id: wo.id,
        folio: wo.folio,
        created_at: wo.created_at,
        horas: Math.round((Date.now() - new Date(wo.created_at).getTime()) / 3600000),
      }));

      return {
        stockCritico,
        gpsPorVencer,
        otsSinTecnico,
        total: stockCritico.length + gpsPorVencer.length + otsSinTecnico.length,
      };
    },
  });
}
