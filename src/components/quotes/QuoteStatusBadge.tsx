import { Badge } from "@/components/ui/badge";
import { QuoteStatus } from "@/types/quotes";

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const statusConfig: Record<QuoteStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  borrador: { label: "Borrador", variant: "secondary" },
  enviada: { label: "Enviada", variant: "default" },
  aceptada: { label: "Aceptada", variant: "default" },
  convertida_ot: { label: "Convertida a OT", variant: "default" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  expirada: { label: "Expirada", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "secondary" }
};

export const QuoteStatusBadge = ({ status }: QuoteStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};
