import { useNavigate } from 'react-router-dom';
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
import { User, Settings, LogOut, Bell, Moon, Sun, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/hooks/useTheme';
import { BrandLogo } from './BrandLogo';
import { GlobalSearch } from './GlobalSearch';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';

export function AppTopbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isMobile } = useResponsiveLayout();
  const { data: alerts, dataUpdatedAt } = useSystemAlerts();

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
      style={{
        height: 'calc(var(--header-h) + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        zIndex: 'var(--z-header)',
      }}
    >
      <div className="flex h-full items-center px-4 gap-3">
        {/* LEFT: Logo + collapse trigger */}
        <div
          className="flex items-center gap-2 shrink-0"
          style={{ minWidth: isMobile ? 'auto' : 'var(--sidebar-w-collapsed)' }}
        >
          <BrandLogo />
        </div>
        <SidebarTrigger className="-ml-1" />

        <div className="flex-1" />

        {/* RIGHT: search + actions + user */}
        <div className="flex items-center gap-1">
          <GlobalSearch trigger="both" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Notificaciones"
              >
                <div className="relative">
                  <Bell className="h-[18px] w-[18px]" />
                  {(alerts?.total ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                      {(alerts?.total ?? 0) > 99 ? '99+' : alerts?.total}
                    </span>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Alertas del sistema</span>
                <span className="text-[11px] text-muted-foreground">
                  {dataUpdatedAt
                    ? new Date(dataUpdatedAt).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {(alerts?.total ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <span className="text-sm text-muted-foreground">Todo al día</span>
                  </div>
                ) : (
                  <>
                    {alerts && alerts.stockCritico.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                          📦 Stock crítico
                        </div>
                        {alerts.stockCritico.map((item) => (
                          <div
                            key={item.id}
                            className="py-2 px-4 hover:bg-muted/50 text-sm flex justify-between gap-2"
                          >
                            <span className="truncate">{item.product_name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {item.stock_actual} / {item.stock_minimo}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {alerts && alerts.gpsPorVencer.length > 0 && (
                      <div className="py-2 border-t">
                        <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                          📡 GPS por vencer
                        </div>
                        {alerts.gpsPorVencer.map((item) => (
                          <div
                            key={item.id}
                            className="py-2 px-4 hover:bg-muted/50 text-sm flex justify-between gap-2"
                          >
                            <span className="truncate">
                              {item.cliente}
                              {item.patente ? ` · ${item.patente}` : ''}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {item.dias_restantes} días
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {alerts && alerts.otsSinTecnico.length > 0 && (
                      <div className="py-2 border-t">
                        <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                          🔧 OTs sin asignar
                        </div>
                        {alerts.otsSinTecnico.map((item) => (
                          <div
                            key={item.id}
                            className="py-2 px-4 hover:bg-muted/50 text-sm flex justify-between gap-2"
                          >
                            <span className="truncate">{item.folio}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              hace {item.horas}h
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="px-4 py-2 border-t">
                <button
                  onClick={() => navigate('/subscriptions/expiring')}
                  className="text-xs text-primary hover:underline"
                >
                  Ver vencimientos GPS →
                </button>
              </div>
            </PopoverContent>
          </Popover>
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
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración de usuario</span>
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
