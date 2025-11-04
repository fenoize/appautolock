import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
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
import { usePermissions } from '@/hooks/usePermissions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: stats } = useDashboardStats();
  const { can, isAdmin } = usePermissions();
  const { isTablet } = useResponsiveLayout();

  const menuItems = [
    {
      title: 'Escritorio',
      icon: LayoutDashboard,
      path: '/dashboard',
      show: true
    },
    {
      title: 'Clientes',
      icon: Users,
      show: isAdmin || can('view', 'clients'),
      items: [
        { title: 'Listado', path: '/clients' },
        { title: 'Reportes', path: '/clients/reports' },
      ]
    },
    {
      title: 'Vehículos',
      icon: Car,
      path: '/vehicles',
      show: isAdmin || can('view', 'vehicles')
    },
    {
      title: 'Cotizaciones',
      icon: FileText,
      badge: stats?.cotizaciones_abiertas,
      show: isAdmin || can('view', 'quotes'),
      items: [
        { title: 'Nueva', path: '/quotes/new' },
        { title: 'Historial', path: '/quotes' },
        { title: 'Reportes', path: '/quotes/reports' },
      ]
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
      ]
    },
    {
      title: 'Suscripciones GPS',
      icon: Radio,
      badge: stats?.subscripciones_vencen,
      badgeVariant: stats?.subscripciones_vencen && stats.subscripciones_vencen > 0 ? 'destructive' : 'default',
      show: isAdmin || can('view', 'subscriptions'),
      items: [
        { title: 'Nueva', path: '/subscriptions/new' },
        { title: 'Listado', path: '/subscriptions' },
        { title: 'Planes', path: '/subscriptions/plans' },
      ]
    },
    {
      title: 'Servicios',
      icon: Briefcase,
      show: isAdmin || can('view', 'services'),
      items: [
        { title: 'Catálogo', path: '/services' },
      ]
    },
    {
      title: 'Inventario',
      icon: Package,
      badge: stats?.stock_critico,
      badgeVariant: stats?.stock_critico && stats.stock_critico > 0 ? 'destructive' : 'default',
      show: isAdmin || can('view', 'inventory'),
      items: [
        { title: 'Productos', path: '/inventory' },
        { title: 'Alertas', path: '/inventory/alerts' },
        { title: 'Reportes', path: '/inventory/reports' },
      ]
    },
    {
      title: 'Usuarios',
      icon: UserCog,
      show: isAdmin || can('view', 'users'),
      items: [
        { title: 'Listado', path: '/admin/users' },
      ]
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
      ]
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => item.show).map((item) => (
                <Collapsible
                  key={item.title}
                  defaultOpen={isGroupActive(item.items)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {item.items ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
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
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.path}>
                                <SidebarMenuSubButton
                                  onClick={() => navigate(subItem.path)}
                                  isActive={isActive(subItem.path)}
                                >
                                  <span>{subItem.title}</span>
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
