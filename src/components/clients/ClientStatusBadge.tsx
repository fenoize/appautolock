import { Badge } from '@/components/ui/badge';
import { ClientStatus } from '@/types/clients';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const variants: Record<ClientStatus, { variant: any; label: string }> = {
    prospecto: { variant: 'secondary', label: 'Prospecto' },
    activo: { variant: 'default', label: 'Activo' },
    mora: { variant: 'destructive', label: 'Mora' },
    suspendido: { variant: 'outline', label: 'Suspendido' }
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
