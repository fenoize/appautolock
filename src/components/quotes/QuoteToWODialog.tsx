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
import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { useConvertQuoteToWO } from '@/hooks/useQuotes';
import { Quote } from '@/types/quotes';

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
  quote: Quote;
  stockAlerts?: StockAlert[];
}

export function QuoteToWODialog({
  open,
  onOpenChange,
  quoteId,
  quote,
  stockAlerts = [],
}: QuoteToWODialogProps) {
  const convertMutation = useConvertQuoteToWO();

  // Validaciones
  const canConvert = quote.estado === 'aceptada';
  const hasVehicle = !!quote.vehicle_id;

  const handleConvert = async () => {
    if (!canConvert || !hasVehicle) {
      return;
    }
    await convertMutation.mutateAsync(quoteId);
    onOpenChange(false);
  };

  const hasStockIssues = stockAlerts.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Convertir Cotización a Orden de Trabajo</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Validación de estado */}
              {!canConvert && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Solo se pueden convertir cotizaciones con estado <strong>"Aceptada"</strong>.
                    Estado actual: <strong>{quote.estado}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Validación de vehículo */}
              {!hasVehicle && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La cotización debe tener un <strong>vehículo asignado</strong> antes de convertirse en OT.
                    Por favor, asigne un vehículo a la cotización primero.
                  </AlertDescription>
                </Alert>
              )}

              {/* Alertas de stock */}
              {hasStockIssues && canConvert && hasVehicle && (
                <>
                  <p className="text-foreground">Se detectaron productos con stock insuficiente:</p>
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
                  <p className="text-sm text-foreground">
                    ¿Deseas continuar de todas formas? La OT se creará con alertas de stock.
                  </p>
                </>
              )}

              {/* Información de la OT a crear (solo si puede convertir) */}
              {canConvert && hasVehicle && !hasStockIssues && (
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Información de la OT
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Folio:</p>
                        <p className="font-medium text-foreground">Se generará automáticamente</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cliente:</p>
                        <p className="font-medium text-foreground">{quote.client?.razon_social || quote.client?.nombre_comercial}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vehículo:</p>
                        <p className="font-medium text-foreground">
                          {quote.vehicle ? `${quote.vehicle.marca} ${quote.vehicle.modelo} - ${quote.vehicle.patente}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Estado Inicial:</p>
                        <p className="font-medium text-foreground">Pendiente</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items:</p>
                        <p className="font-medium text-foreground">{quote.items?.length || 0} productos/servicios</p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Package className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-1 text-foreground">Verificación de inventario</p>
                      <p className="text-sm">
                        El sistema verificará la disponibilidad de stock de los productos.
                        Si hay productos sin stock suficiente, se generarán alertas pero la OT se creará de todas formas.
                      </p>
                    </AlertDescription>
                  </Alert>

                  <p className="text-sm text-foreground">
                    ¿Está seguro que desea convertir la cotización <strong>{quote.folio}</strong> a una orden de trabajo?
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={convertMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConvert}
            disabled={convertMutation.isPending || !canConvert || !hasVehicle}
          >
            {convertMutation.isPending ? 'Convirtiendo...' : 'Convertir a OT'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
