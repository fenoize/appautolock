import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useConvertQuoteToWO } from '@/hooks/useQuotes';

interface StockAlert {
  producto_id: string;
  nombre: string;
  cantidad_requerida: number;
  stock_disponible: number;
  faltante: number;
}

interface QuoteToWODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  stockAlerts?: StockAlert[];
}

export function QuoteToWODialog({
  open,
  onOpenChange,
  quoteId,
  stockAlerts = [],
}: QuoteToWODialogProps) {
  const convertMutation = useConvertQuoteToWO();

  const handleConvert = async () => {
    await convertMutation.mutateAsync(quoteId);
    onOpenChange(false);
  };

  const hasStockIssues = stockAlerts.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Convertir a Orden de Trabajo</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {hasStockIssues ? (
              <>
                <p>Se detectaron productos con stock insuficiente:</p>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {stockAlerts.map((alert) => (
                        <li key={alert.producto_id}>
                          <strong>{alert.nombre}</strong>: Faltan {alert.faltante} unidades
                          (disponible: {alert.stock_disponible}, requerido: {alert.cantidad_requerida})
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
                <p className="text-sm">
                  ¿Deseas continuar de todas formas? La OT se creará con alertas de stock.
                </p>
              </>
            ) : (
              <p>
                Esta acción convertirá la cotización en una orden de trabajo. 
                Se copiarán todos los items y se generará un nuevo folio de OT.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={convertMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConvert}
            disabled={convertMutation.isPending}
          >
            {convertMutation.isPending ? 'Convirtiendo...' : 'Convertir a OT'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
