import { Quote } from '@/types/quotes';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';

interface InvoiceInfoProps {
  quote: Quote;
}

export function InvoiceInfo({ quote }: InvoiceInfoProps) {
  const fechaEmision = quote.fecha_emision ? new Date(quote.fecha_emision) : new Date();
  const fechaVencimiento = new Date(fechaEmision);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + (quote.validez_dias || 30));

  return (
    <div className="space-y-4">
      <Separator />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Folio */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Folio</p>
          <p className="font-mono font-semibold text-foreground">{quote.folio}</p>
        </div>

        {/* Fecha Emisión */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fecha Emisión</p>
          <p className="font-medium text-foreground">
            {format(fechaEmision, "dd/MM/yyyy", { locale: es })}
          </p>
        </div>

        {/* Validez */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Válido Hasta</p>
          <p className="font-medium text-foreground">
            {format(fechaVencimiento, "dd/MM/yyyy", { locale: es })}
          </p>
        </div>

        {/* Estado */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Estado</p>
          <QuoteStatusBadge status={quote.estado} />
        </div>
      </div>

      {/* Vendedor y Sucursal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Vendedor</p>
          <p className="font-medium text-foreground">
            {quote.vendedor?.nombre} {quote.vendedor?.apellido}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Sucursal</p>
          <p className="font-medium text-foreground">
            {quote.branch?.nombre}
          </p>
        </div>
      </div>

      {/* Vehículo si existe */}
      {quote.vehicle && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Vehículo</p>
          <p className="font-medium text-foreground">
            {quote.vehicle.marca} {quote.vehicle.modelo} - 
            <span className="font-mono ml-1">{quote.vehicle.patente}</span>
            {quote.vehicle.anio && ` (${quote.vehicle.anio})`}
          </p>
        </div>
      )}

      {/* Email enviado */}
      <div>
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Mail className="h-3 w-3" /> Email enviado
        </p>
        {quote.email_enviado_at ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent">Enviada</Badge>
            <span className="text-sm text-foreground">
              {format(new Date(quote.email_enviado_at), "dd/MM/yyyy HH:mm", { locale: es })}
              {quote.email_destinatario && (
                <> a <span className="font-medium">{quote.email_destinatario}</span></>
              )}
            </span>
          </div>
        ) : (
          <Badge variant="secondary">No enviada</Badge>
        )}
      </div>

      <Separator />
    </div>
  );
}