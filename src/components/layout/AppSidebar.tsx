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
  SidebarSeparator,
  useSidebar,
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
  SearchCheck,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringSubscriptions } from '@/hooks/useSubscriptions';
import { usePermissions } from '@/hooks/usePermissions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: stats } = useDashboardStats();
  const { data: expiring10 } = useExpiringSubscriptions(10);
  const expiringCount = expiring10?.length ?? 0;
  const { can, isAdmin, isLoading } = usePermissions();
  const { isTablet } = useResponsiveLayout();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = (path: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate(path);
  };

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
          title: 'Consultar',
          icon: SearchCheck,
          path: '/consultar',
          show: isAdmin || can('view', 'quotes'),
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
          ],
        },
        {
          title: 'Órdenes de Trabajo',
          icon: Wrench,
          badge: stats?.ots_hoy,
          show: isAdmin || can('view', 'work_orders'),
          items: [
            { title: 'Nueva', path: '/work-orders/new' },
            { title: 'Agenda', path: '/work-orders/calendar' },
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
            { title: 'Escritorio', path: '/subscriptions/dashboard' },
            { title: 'Nueva', path: '/subscriptions/new' },
            { title: 'Listado', path: '/subscriptions/list' },
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
            { title: 'Bodegas', path: '/inventory/bodegas' },
            { title: 'Recepciones', path: '/inventory/recepciones' },
            { title: 'Técnicos', path: '/inventory/technicians' },
            { title: 'Alertas', path: '/inventory/alerts' },
            { title: 'Reportes', path: '/inventory/reports' },
          ],
        },
        {
          title: 'Proveedores',
          icon: Truck,
          path: '/proveedores',
          show: isAdmin || can('view', 'inventory'),
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

  if (isLoading) {
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
          <div className="p-3 space-y-2 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

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
        {sections.map((section, sectionIndex) => {
          const visibleItems = section.items.filter((i: any) => i.show);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.08em] font-semibold text-sidebar-foreground/50 px-3 pt-2">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item: any, index: number) => {
                    const itemActive = isActive(item.path || '') || isGroupActive(item.items);
                    const activeCls = 'bg-sidebar-accent text-sidebar-accent-foreground font-medium [&>svg]:text-sidebar-accent-foreground';
                    return [
                      <Collapsible
                        key={item.title}
                        defaultOpen={isGroupActive(item.items)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          {item.items ? (
                            <>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton className={itemActive ? activeCls : ''}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                  {item.badge !== undefined && item.badge > 0 && (
                                    <Badge variant={(item.badgeVariant as any) || 'default'} className="ml-auto">
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
                                        onClick={() => handleNavigate(subItem.path)}
                                        isActive={isActive(subItem.path)}
                                        className={isActive(subItem.path) ? 'text-sidebar-accent-foreground bg-sidebar-accent font-medium' : ''}
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
                              onClick={() => item.path && handleNavigate(item.path)}
                              isActive={isActive(item.path || '')}
                              className={isActive(item.path || '') ? activeCls : ''}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {item.badge !== undefined && item.badge > 0 && (
                                <Badge variant={(item.badgeVariant as any) || 'default'} className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      </Collapsible>,
                      index < visibleItems.length - 1 && (
                        <li key={`sep-${item.title}`} className="list-none">
                          <SidebarSeparator className="my-1" />
                        </li>
                      )
                    ];
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              {sectionIndex < sections.length - 1 && <SidebarSeparator className="mt-2 mb-1" />}
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
