import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Plus,
  MoreHorizontal,
  SearchCheck,
  FileText,
  Car,
  Radio,
  AlertTriangle,
  Briefcase,
  Package,
  Truck,
  UserCog,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { useExpiringSubscriptions } from '@/hooks/useSubscriptions';

const mainItems = [
  { icon: LayoutDashboard, label: 'Escritorio', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clients' },
];

const moreSections = [
  {
    label: 'Consultas',
    items: [
      { icon: SearchCheck, label: 'Consultar', path: '/consultar', show: true },
      { icon: FileText, label: 'Cotizaciones', path: '/quotes', showKey: 'quotes' },
      { icon: Car, label: 'Vehículos', path: '/vehicles', showKey: 'vehicles' },
    ],
  },
  {
    label: 'GPS',
    items: [
      { icon: Radio, label: 'Suscripciones', path: '/subscriptions/dashboard', showKey: 'subscriptions' },
      { icon: AlertTriangle, label: 'Vencimientos', path: '/subscriptions/expiring', showKey: 'subscriptions', badge: 'expiring' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { icon: Briefcase, label: 'Servicios', path: '/services', showKey: 'services' },
      { icon: Package, label: 'Inventario', path: '/inventory', showKey: 'inventory' },
      { icon: Truck, label: 'Proveedores', path: '/proveedores', showKey: 'inventory' },
    ],
  },
];

export function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { isAdmin, can } = usePermissions();
  const { data: expiring } = useExpiringSubscriptions(10);
  const expiringCount = expiring?.length ?? 0;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const canShow = (showKey?: string) => {
    if (!showKey) return true;
    return isAdmin || can('view', showKey as any);
  };

  const visibleMoreSections = moreSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.showKey === 'subscriptions' && !isAdmin && !can('view', 'subscriptions')) {
          return false;
        }
        return canShow(item.showKey);
      }),
    }))
    .filter((section) => section.items.length > 0);

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t bg-card shadow-lg md:hidden"
      style={{
        height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 'var(--z-header)',
      }}
    >
      <div className="flex items-end justify-around h-full px-1">
        {mainItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 pb-1',
              isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}

        <div className="flex flex-col items-center justify-end flex-1 h-full">
          <button
            onClick={() => navigate('/work-orders/new')}
            className="flex items-center justify-center rounded-full shadow-md"
            style={{
              width: 52,
              height: 52,
              marginTop: -20,
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
            aria-label="Nueva OT"
          >
            <Plus className="h-6 w-6" />
          </button>
          <span className="text-[10px] text-primary mt-0.5">Nueva OT</span>
        </div>

        <button
          onClick={() => navigate('/work-orders')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 pb-1',
            isActive('/work-orders') ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <Wrench className="h-5 w-5" />
          <span className="text-[10px]">OTs</span>
        </button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 pb-1',
                open ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px]">Más</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[82vh] flex flex-col px-0 pb-0">
            <div className="flex flex-col h-full">
              <div className="px-4 pt-2 pb-3 shrink-0">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Menú</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-muted p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Cerrar menú"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Separator />
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {visibleMoreSections.map((section) => (
                  <div key={section.label}>
                    <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 first:mt-0">
                      {section.label}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleNavigate(item.path)}
                          className="flex w-full items-center gap-3 px-1 py-[11px] text-left hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                          <span className="text-sm">{item.label}</span>
                          {item.badge === 'expiring' && expiringCount > 0 && (
                            <Badge variant="destructive" className="ml-auto text-[10px] px-1.5">
                              {expiringCount}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <div>
                    <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Administración
                    </p>
                    <button
                      onClick={() => handleNavigate('/admin/users')}
                      className="flex w-full items-center gap-3 px-1 py-[11px] text-left hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <UserCog className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                      <span className="text-sm">Usuarios</span>
                    </button>
                  </div>
                )}

                <Separator className="my-3" />

                <button
                  onClick={() => handleNavigate('/settings')}
                  className="flex w-full items-center gap-3 px-1 py-[11px] text-left hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
                >
                  <Settings className="h-[18px] w-[18px] shrink-0" />
                  <span className="text-sm">Configuración</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
