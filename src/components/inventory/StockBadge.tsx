import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
  stock: number;
  stockMinimo: number;
}

export function StockBadge({ stock, stockMinimo }: StockBadgeProps) {
  if (stock <= 0) {
    return <Badge variant="destructive">Sin Stock</Badge>;
  }
  
  if (stock < stockMinimo) {
    return <Badge className="bg-orange-500">Bajo Mínimo</Badge>;
  }
  
  return <Badge className="bg-green-500">Normal</Badge>;
}
