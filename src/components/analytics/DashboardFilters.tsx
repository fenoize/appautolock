import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardFilters as Filters } from '@/types/analytics';
import { Filter, X } from 'lucide-react';

interface DashboardFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showTechnicianFilter?: boolean;
  showVendorFilter?: boolean;
}

export const DashboardFilters = ({
  filters,
  onFiltersChange,
  showTechnicianFilter = false,
  showVendorFilter = false,
}: DashboardFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const cleared: Filters = {
      fecha_desde: firstDayOfMonth.toISOString().split('T')[0],
      fecha_hasta: today.toISOString().split('T')[0],
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="fecha_desde">Desde</Label>
            <Input
              id="fecha_desde"
              type="date"
              value={localFilters.fecha_desde}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, fecha_desde: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="fecha_hasta">Hasta</Label>
            <Input
              id="fecha_hasta"
              type="date"
              value={localFilters.fecha_hasta}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, fecha_hasta: e.target.value })
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleApply} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Aplicar
            </Button>
            <Button onClick={handleClear} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
