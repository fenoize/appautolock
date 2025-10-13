import { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, subMonths, startOfYear, subDays, format } from 'date-fns';

export interface DashboardFilters {
  fecha_desde: string;
  fecha_hasta: string;
  branch_id?: string;
}

export type PeriodPreset = '7d' | '30d' | '90d' | 'mes_actual' | 'mes_anterior' | 'año_actual' | 'custom';

const STORAGE_KEY = 'dashboard_filters';

function calculateDates(preset: PeriodPreset): { desde: string; hasta: string } {
  const today = new Date();
  
  switch (preset) {
    case '7d':
      return {
        desde: format(subDays(today, 7), 'yyyy-MM-dd'),
        hasta: format(today, 'yyyy-MM-dd')
      };
    case '30d':
      return {
        desde: format(subDays(today, 30), 'yyyy-MM-dd'),
        hasta: format(today, 'yyyy-MM-dd')
      };
    case '90d':
      return {
        desde: format(subDays(today, 90), 'yyyy-MM-dd'),
        hasta: format(today, 'yyyy-MM-dd')
      };
    case 'mes_actual':
      return {
        desde: format(startOfMonth(today), 'yyyy-MM-dd'),
        hasta: format(endOfMonth(today), 'yyyy-MM-dd')
      };
    case 'mes_anterior':
      const prevMonth = subMonths(today, 1);
      return {
        desde: format(startOfMonth(prevMonth), 'yyyy-MM-dd'),
        hasta: format(endOfMonth(prevMonth), 'yyyy-MM-dd')
      };
    case 'año_actual':
      return {
        desde: format(startOfYear(today), 'yyyy-MM-dd'),
        hasta: format(today, 'yyyy-MM-dd')
      };
    default:
      return {
        desde: format(startOfMonth(today), 'yyyy-MM-dd'),
        hasta: format(endOfMonth(today), 'yyyy-MM-dd')
      };
  }
}

export function useDashboardFilters() {
  const [preset, setPreset] = useState<PeriodPreset>('mes_actual');
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    // Cargar desde localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored filters', e);
      }
    }
    
    // Default: mes actual
    const dates = calculateDates('mes_actual');
    return {
      fecha_desde: dates.desde,
      fecha_hasta: dates.hasta
    };
  });

  // Guardar en localStorage cuando cambien los filtros
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const setPresetPeriod = (newPreset: PeriodPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const dates = calculateDates(newPreset);
      setFilters(prev => ({
        ...prev,
        fecha_desde: dates.desde,
        fecha_hasta: dates.hasta
      }));
    }
  };

  const setCustomDates = (desde: string, hasta: string) => {
    setPreset('custom');
    setFilters(prev => ({
      ...prev,
      fecha_desde: desde,
      fecha_hasta: hasta
    }));
  };

  const setBranch = (branchId?: string) => {
    setFilters(prev => ({
      ...prev,
      branch_id: branchId
    }));
  };

  return {
    filters,
    preset,
    setPresetPeriod,
    setCustomDates,
    setBranch
  };
}
