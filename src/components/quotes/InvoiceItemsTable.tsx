import { QuoteItem } from '@/types/quotes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Satellite } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface InvoiceItemsTableProps {
  items: QuoteItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  const { data: products } = useProducts();
  const gpsProductIds = new Set(
    (products ?? [])
      .filter(p => (p.tipos_suscripcion_disponibles?.length ?? 0) > 0)
      .map(p => p.id)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase">
        Items / Productos y Servicios
      </h3>
      
      <div className="border rounded-lg overflow-hidden">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[50%]">Descripción</TableHead>
                <TableHead className="text-center w-[15%]">Cantidad</TableHead>
                <TableHead className="text-right w-[17.5%]">Precio Unit.</TableHead>
                <TableHead className="text-right w-[17.5%]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isGps = item.item_tipo === 'producto' && item.ref_id && gpsProductIds.has(item.ref_id);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-center">
                      {isGps && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex text-primary">
                              <Satellite className="h-4 w-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Este producto incluye suscripción GPS mensual
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{item.nombre}</p>
                        {item.descripcion && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {item.descripcion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted">
                            {item.item_tipo === 'producto' ? '📦 Producto' : '🔧 Servicio'}
                          </span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {item.cantidad}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.precio_unitario)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}
