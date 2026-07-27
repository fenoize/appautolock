import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'operador' | 'tecnico' | 'vendedor' | 'cliente';

interface PermissionMatrix {
  [resource: string]: {
    [action: string]: AppRole[];
  };
}

const PERMISSIONS: PermissionMatrix = {
  clients: {
    view: ['admin', 'operador', 'vendedor'],
    create: ['admin', 'vendedor'],
    edit: ['admin', 'vendedor'],
    delete: ['admin']
  },
  work_orders: {
    view: ['admin', 'operador', 'tecnico'],
    create: ['admin', 'operador'],
    assign: ['admin', 'operador'],
    execute: ['tecnico'],
    close: ['admin', 'tecnico']
  },
  quotes: {
    view: ['admin', 'operador', 'vendedor'],
    create: ['admin', 'vendedor'],
    approve: ['admin'],
    send: ['admin', 'vendedor']
  },
  inventory: {
    view: ['admin', 'operador', 'tecnico'],
    edit: ['admin', 'operador'],
    move: ['admin', 'operador', 'tecnico']
  },
  users: {
    view: ['admin'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin']
  },
  subscriptions: {
    view: ['admin', 'operador', 'vendedor'],
    create: ['admin', 'vendedor'],
    edit: ['admin'],
    cancel: ['admin']
  },
  vehicles: {
    view: ['admin', 'operador', 'vendedor', 'tecnico'],
    create: ['admin', 'operador'],
    edit: ['admin', 'operador'],
    delete: ['admin']
  },
  services: {
    view: ['admin', 'operador', 'vendedor'],
    create: ['admin', 'operador'],
    edit: ['admin', 'operador'],
    delete: ['admin']
  },
  reports: {
    view: ['admin', 'operador'],
    export: ['admin']
  }
};

export function usePermissions() {
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) throw error;
      return data?.map(r => r.role as AppRole) || [];
    },
    enabled: !!session?.user?.id
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.includes(role) || false;
  };

  const hasAnyRole = (requiredRoles: AppRole[]): boolean => {
    return requiredRoles.some(role => hasRole(role));
  };

  const can = (action: string, resource: string): boolean => {
    const allowedRoles = PERMISSIONS[resource]?.[action] || [];
    return hasAnyRole(allowedRoles);
  };

  return { 
    hasRole, 
    hasAnyRole, 
    can, 
    roles: roles || [],
    isAdmin: hasRole('admin'),
    isLoading: sessionLoading || rolesLoading
  };
}
