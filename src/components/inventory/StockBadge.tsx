import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
  stock: number;
  stockMinimo: number;
}

export function StockBadge({ stock, stockMinimo }: StockBadgeProps) {
  if (stock <= 0) {
    return <Badge variant="destructive" className="font-medium">Sin Stock</Badge>;
  }
  
  if (stock < stockMinimo) {
    return <Badge variant="warning" className="font-medium">Bajo Mínimo</Badge>;
  }
  
  return <Badge variant="success" className="font-medium">Normal</Badge>;
}
