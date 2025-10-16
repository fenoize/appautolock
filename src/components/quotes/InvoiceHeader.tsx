import { FileText } from 'lucide-react';
import { Quote } from '@/types/quotes';
import { Separator } from '@/components/ui/separator';

interface InvoiceHeaderProps {
  quote: Quote;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
}

export function InvoiceHeader({ 
  quote, 
  companyName = "GPS Service",
  companyAddress = "Av. Principal 123, Santiago",
  companyEmail = "contacto@gpsservice.cl",
  companyPhone = "+56 9 1234 5678"
}: InvoiceHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Logo y Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">COTIZACIÓN</h1>
            <p className="text-sm text-muted-foreground">Quote / Quotation</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Información Emisor y Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Emisor */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Emisor / From</h3>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{companyName}</p>
            <p className="text-sm text-muted-foreground">{companyAddress}</p>
            <p className="text-sm text-muted-foreground">{companyEmail}</p>
            <p className="text-sm text-muted-foreground">{companyPhone}</p>
          </div>
        </div>

        {/* Cliente */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Cliente / To</h3>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {quote.client?.nombre_comercial || quote.client?.razon_social}
            </p>
            {quote.client?.rut && (
              <p className="text-sm text-muted-foreground font-mono">
                RUT: {quote.client.rut}-{quote.client?.dv}
              </p>
            )}
            {quote.client?.email_principal && (
              <p className="text-sm text-muted-foreground">{quote.client.email_principal}</p>
            )}
            {quote.client?.telefonos && quote.client.telefonos.length > 0 && (
              <p className="text-sm text-muted-foreground">{quote.client.telefonos[0]}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}