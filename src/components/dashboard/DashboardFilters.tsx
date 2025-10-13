import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardFilters, PeriodPreset } from '@/hooks/useDashboardFilters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function DashboardFilters() {
  const { filters, preset, setPresetPeriod, setCustomDates, setBranch } = useDashboardFilters();
  
  // Obtener lista de sucursales
  const { data: branches } = useQuery({
    queryKey: ['branches-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, nombre')
        .eq('activa', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Período Preset */}
          <div className="space-y-2">
            <Label htmlFor="period-preset">Período</Label>
            <Select
              value={preset}
              onValueChange={(value) => setPresetPeriod(value as PeriodPreset)}
            >
              <SelectTrigger id="period-preset">
                <SelectValue placeholder="Selecciona período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="mes_actual">Mes actual</SelectItem>
                <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                <SelectItem value="año_actual">Año actual</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fechas Custom (solo si preset === 'custom') */}
          {preset === 'custom' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fecha-desde">Desde</Label>
                <Input
                  id="fecha-desde"
                  type="date"
                  value={filters.fecha_desde}
                  onChange={(e) => setCustomDates(e.target.value, filters.fecha_hasta)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha-hasta">Hasta</Label>
                <Input
                  id="fecha-hasta"
                  type="date"
                  value={filters.fecha_hasta}
                  onChange={(e) => setCustomDates(filters.fecha_desde, e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="branch">Sucursal</Label>
              <Select
                value={filters.branch_id || 'all'}
                onValueChange={(value) => setBranch(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
