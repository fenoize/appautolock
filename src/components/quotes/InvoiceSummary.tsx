import { Quote } from '@/types/quotes';
import { Separator } from '@/components/ui/separator';
import { useProducts } from '@/hooks/useProducts';
import { AlertTriangle } from 'lucide-react';

interface InvoiceSummaryProps {
  quote: Quote;
}

export function InvoiceSummary({ quote }: InvoiceSummaryProps) {
  const { data: products } = useProducts();
  const gpsProductIds = new Set(
    (products ?? [])
      .filter(p => (p.tipos_suscripcion_disponibles?.length ?? 0) > 0)
      .map(p => p.id)
  );
  const gpsCount = (quote.items ?? []).filter(
    (i) => i.item_tipo === 'producto' && i.ref_id && gpsProductIds.has(i.ref_id)
  ).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <Separator />
      
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-mono">{formatCurrency(quote.neto)}</span>
          </div>

          {/* IVA */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (19%):</span>
            <span className="font-mono">{formatCurrency(quote.iva)}</span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between">
            <span className="text-lg font-semibold">TOTAL:</span>
            <span className="text-lg font-bold font-mono text-primary">
              {formatCurrency(quote.total)}
            </span>
          </div>
        </div>
      </div>

      {gpsCount > 0 && (
        <div className="flex gap-2 items-start rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Esta cotización incluye <strong>{gpsCount}</strong> producto(s) GPS que requieren suscripción mensual.
            El costo del plan de monitoreo se gestiona por separado y no está incluido en este total.
          </p>
        </div>
      )}

      {/* Notas */}
      {quote.notas && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Notas / Notes
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quote.notas}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
