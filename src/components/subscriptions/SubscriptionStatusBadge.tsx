import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@/types/subscriptions";

interface Props {
  status: SubscriptionStatus;
}

const statusConfig: Record<SubscriptionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  activa: { label: "Activa", variant: "default" },
  mora: { label: "En Mora", variant: "outline" },
  suspendida: { label: "Suspendida", variant: "destructive" },
  cancelada: { label: "Cancelada", variant: "secondary" }
};

export function SubscriptionStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
