import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Escritorio',
  clients: 'Clientes',
  vehicles: 'Vehículos',
  quotes: 'Cotizaciones',
  'work-orders': 'Órdenes de Trabajo',
  subscriptions: 'Suscripciones GPS',
  inventory: 'Inventario',
  compatibility: 'Compatibilidad de Productos',
  services: 'Servicios',
  admin: 'Administración',
  users: 'Usuarios',
  settings: 'Configuración',
  profile: 'Mi Perfil',
  analytics: 'Analítica',
};

export function AppTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const firstSegment = location.pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const sectionTitle = SECTION_TITLES[firstSegment] ?? 'Autolock';

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const userInitials = profile 
    ? `${profile.nombre?.[0] || ''}${profile.apellido?.[0] || ''}`
    : session?.user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header
      className="fixed top-0 left-0 right-0 w-full border-b border-border bg-card shadow-sm"
      style={{
        height: 'var(--header-h)',
        zIndex: 'var(--z-header)'
      }}
    >
      <div className="flex h-full items-center px-4 gap-4">
        <SidebarTrigger className="-ml-1" />

        <h1 className="text-lg font-semibold text-foreground truncate">{sectionTitle}</h1>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 gap-2 px-2 rounded-full hover:bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[140px] truncate">
                {profile ? `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim() || (session?.user?.email ?? '') : (session?.user?.email ?? 'Usuario')}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
