import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@/types/users';

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const variants = {
    activo: { variant: 'default' as const, className: 'bg-green-500', label: 'Activo' },
    inactivo: { variant: 'destructive' as const, className: '', label: 'Inactivo' },
    invitado: { variant: 'secondary' as const, className: 'bg-blue-500', label: 'Invitado' },
  };
  
  const { variant, className, label } = variants[status];
  
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
