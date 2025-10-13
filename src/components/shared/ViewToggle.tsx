import { LayoutGrid, Table } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ViewToggleProps {
  view: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(v) => v && onViewChange(v as 'grid' | 'table')}
    >
      <ToggleGroupItem value="grid" aria-label="Vista de tarjetas">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Vista de tabla">
        <Table className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
