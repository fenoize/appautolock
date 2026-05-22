import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function MobilePagination({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 w-full">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página <span className="font-semibold text-foreground">{currentPage}</span> de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Siguiente <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
