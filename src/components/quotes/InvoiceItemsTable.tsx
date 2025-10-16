import { QuoteItem } from '@/types/quotes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceItemsTableProps {
  items: QuoteItem[];
}

export function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
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
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50%]">Descripción</TableHead>
              <TableHead className="text-center w-[15%]">Cantidad</TableHead>
              <TableHead className="text-right w-[17.5%]">Precio Unit.</TableHead>
              <TableHead className="text-right w-[17.5%]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}