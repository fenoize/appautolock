import { Quote } from '@/types/quotes';
import { Separator } from '@/components/ui/separator';

interface InvoiceSummaryProps {
  quote: Quote;
}

export function InvoiceSummary({ quote }: InvoiceSummaryProps) {
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