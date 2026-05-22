import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Search, Bell, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/hooks/useTheme';

export function AppTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
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
    enabled: !!session?.user?.id,
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
      style={{ height: 'var(--header-h)', zIndex: 'var(--z-header)' }}
    >
      <div className="flex h-full items-center px-4 gap-3">
        <SidebarTrigger className="-ml-1" />

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-card h-9 rounded-full"
          />
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
            <Bell className="h-[18px] w-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Cambiar tema"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2 ml-1 rounded-full hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[140px] truncate">
                  {profile
                    ? `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim() || (session?.user?.email ?? '')
                    : session?.user?.email ?? 'Usuario'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
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
      </div>
    </header>
  );
}
