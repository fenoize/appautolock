import { Badge } from "@/components/ui/badge";
import { WOStatus } from "@/types/workOrders";

interface WOStatusBadgeProps {
  status: WOStatus;
}

const statusConfig: Record<WOStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  asignada: { label: "Asignada", variant: "default" },
  programada: { label: "Programada", variant: "default" },
  en_ruta: { label: "En Ruta", variant: "default" },
  en_proceso: { label: "En Proceso", variant: "default" },
  pausada: { label: "Pausada", variant: "outline" },
  reprogramada: { label: "Reprogramada", variant: "outline" },
  completada: { label: "Completada", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" }
};

export const WOStatusBadge = ({ status }: WOStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};
