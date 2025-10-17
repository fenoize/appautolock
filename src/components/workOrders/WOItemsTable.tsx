import { WOItem } from '@/types/workOrders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Wrench } from 'lucide-react';

interface WOItemsTableProps {
  items?: WOItem[];
}

export function WOItemsTable({ items }: WOItemsTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No hay items asignados a esta orden de trabajo</p>
        <p className="text-xs mt-1">Los items se añaden al crear la OT o desde una cotización</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-[45%]">Descripción</TableHead>
            <TableHead className="text-center w-[20%]">Tipo</TableHead>
            <TableHead className="text-center w-[15%]">Cantidad</TableHead>
            <TableHead className="w-[20%]">Referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={item.id}>
              <TableCell className="text-center text-muted-foreground font-mono text-xs">
                {idx + 1}
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">{item.nombre}</p>
              </TableCell>
              <TableCell className="text-center">
                {item.item_tipo === 'producto' ? (
                  <Badge variant="default" className="gap-1">
                    <Package className="h-3 w-3" />
                    Producto
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Wrench className="h-3 w-3" />
                    Servicio
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="font-mono font-semibold">{item.cantidad}</span>
              </TableCell>
              <TableCell>
                {item.ref_id ? (
                  <code className="text-xs px-2 py-1 bg-muted rounded">{item.ref_id.slice(0, 8)}</code>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="p-3 bg-muted/30 border-t">
        <p className="text-xs text-muted-foreground">
          Total de items: <span className="font-semibold text-foreground">{items.length}</span>
        </p>
      </div>
    </div>
  );
}
