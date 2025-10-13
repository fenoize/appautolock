import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/hooks/usePermissions';

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'md';
}

const roleConfig: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  admin: { 
    label: 'Administrador', 
    variant: 'default'
  },
  operador: { 
    label: 'Operador', 
    variant: 'secondary'
  },
  tecnico: { 
    label: 'Técnico', 
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
  },
  vendedor: { 
    label: 'Vendedor', 
    variant: 'outline',
    className: 'border-green-500 text-green-700 dark:text-green-400'
  },
  cliente: { 
    label: 'Cliente', 
    variant: 'outline',
    className: 'border-purple-500 text-purple-700 dark:text-purple-400'
  }
};

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className || ''} ${size === 'sm' ? 'text-xs' : ''}`}
    >
      {config.label}
    </Badge>
  );
}
