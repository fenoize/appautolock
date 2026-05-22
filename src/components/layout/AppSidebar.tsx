import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  Wrench,
  Radio,
  Package,
  UserCog,
  Briefcase,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringSubscriptions } from '@/hooks/useSubscriptions';
import { usePermissions } from '@/hooks/usePermissions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: stats } = useDashboardStats();
  const { data: expiring10 } = useExpiringSubscriptions(10);
  const expiringCount = expiring10?.length ?? 0;
  const { can, isAdmin } = usePermissions();
  const { isTablet } = useResponsiveLayout();

  const sections: Array<{
    label: string;
    items: Array<any>;
  }> = [
    {
      label: 'Navegación',
      items: [
        {
          title: 'Escritorio',
          icon: LayoutDashboard,
          path: '/dashboard',
          show: true,
        },
        {
          title: 'Clientes',
          icon: Users,
          show: isAdmin || can('view', 'clients'),
          items: [
            { title: 'Listado', path: '/clients' },
            { title: 'Reportes', path: '/clients/reports' },
          ],
        },
        {
          title: 'Vehículos',
          icon: Car,
          path: '/vehicles',
          show: isAdmin || can('view', 'vehicles'),
        },
      ],
    },
    {
      label: 'Operación',
      items: [
        {
          title: 'Cotizaciones',
          icon: FileText,
          badge: stats?.cotizaciones_abiertas,
          show: isAdmin || can('view', 'quotes'),
          items: [
            { title: 'Nueva', path: '/quotes/new' },
            { title: 'Historial', path: '/quotes' },
            { title: 'Reportes', path: '/quotes/reports' },
          ],
        },
        {
          title: 'Órdenes de Trabajo',
          icon: Wrench,
          badge: stats?.ots_hoy,
          show: isAdmin || can('view', 'work_orders'),
          items: [
            { title: 'Nueva', path: '/work-orders/new' },
            { title: 'Agenda', path: '/work-orders/agenda' },
            { title: 'Historial', path: '/work-orders' },
          ],
        },
        {
          title: 'Suscripciones GPS',
          icon: Radio,
          badge: expiringCount || stats?.subscripciones_vencen,
          badgeVariant: expiringCount > 0 ? 'destructive' : 'default',
          show: isAdmin || can('view', 'subscriptions'),
          items: [
            { title: 'Nueva', path: '/subscriptions/new' },
            { title: 'Listado', path: '/subscriptions' },
            { title: 'Vencimientos', path: '/subscriptions/expiring', badge: expiringCount },
            { title: 'Planes', path: '/subscriptions/plans' },
          ],
        },
        {
          title: 'Servicios',
          icon: Briefcase,
          show: isAdmin || can('view', 'services'),
          items: [{ title: 'Catálogo', path: '/services' }],
        },
        {
          title: 'Inventario',
          icon: Package,
          badge: stats?.stock_critico,
          badgeVariant: stats?.stock_critico && stats.stock_critico > 0 ? 'destructive' : 'default',
          show: isAdmin || can('view', 'inventory'),
          items: [
            { title: 'Productos', path: '/inventory' },
            { title: 'Compatibilidad', path: '/compatibility' },
            { title: 'Alertas', path: '/inventory/alerts' },
            { title: 'Reportes', path: '/inventory/reports' },
          ],
        },
      ],
    },
    {
      label: 'Administración',
      items: [
        {
          title: 'Usuarios',
          icon: UserCog,
          show: isAdmin || can('view', 'users'),
          items: [{ title: 'Listado', path: '/admin/users' }],
        },
        {
          title: 'Configuración',
          icon: Settings,
          show: true,
          items: [
            { title: 'General', path: '/settings' },
            { title: 'Empresa', path: '/settings/company' },
            { title: 'Numeradores', path: '/settings/numeradores' },
            { title: 'Notificaciones', path: '/settings/notifications' },
            { title: 'Integraciones', path: '/settings/integrations' },
            { title: 'Respaldos', path: '/settings/backups' },
            { title: 'Auditoría', path: '/settings/audit' },
          ],
        },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (items?: { path: string }[]) => 
    items?.some(item => location.pathname.startsWith(item.path));

  return (
    <Sidebar
      collapsible={isTablet ? "offcanvas" : "icon"}
      style={{
        top: 'var(--header-h)',
        height: 'calc(100vh - var(--header-h))',
        zIndex: 'var(--z-sidebar)'
      } as any}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="text-base font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Autolock
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => item.show).map((item) => {
                const itemActive = isActive(item.path || '') || isGroupActive(item.items);
                return (
                <Collapsible
                  key={item.title}
                  defaultOpen={isGroupActive(item.items)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {item.items ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className={itemActive ? '[&>svg]:text-primary' : ''}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <Badge
                                variant={item.badgeVariant as any || 'default'}
                                className="ml-auto"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem: any) => (
                              <SidebarMenuSubItem key={subItem.path}>
                                <SidebarMenuSubButton
                                  onClick={() => navigate(subItem.path)}
                                  isActive={isActive(subItem.path)}
                                  className={isActive(subItem.path) ? 'text-primary font-medium' : ''}
                                >
                                  <span>{subItem.title}</span>
                                  {subItem.badge !== undefined && subItem.badge > 0 && (
                                    <Badge variant="destructive" className="ml-auto">
                                      {subItem.badge}
                                    </Badge>
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton
                        onClick={() => item.path && navigate(item.path)}
                        isActive={isActive(item.path || '')}
                        className={isActive(item.path || '') ? '[&>svg]:text-primary text-primary' : ''}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge
                            variant={item.badgeVariant as any || 'default'}
                            className="ml-auto"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
