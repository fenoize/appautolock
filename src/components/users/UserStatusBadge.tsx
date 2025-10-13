import { Badge } from '@/components/ui/badge';

interface UserStatusBadgeProps {
  active: boolean;
}

export function UserStatusBadge({ active }: UserStatusBadgeProps) {
  return (
    <Badge variant={active ? 'default' : 'destructive'} className={active ? 'bg-green-500' : ''}>
      {active ? 'Activo' : 'Inactivo'}
    </Badge>
  );
}
