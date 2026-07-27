import { useNavigate, useLocation } from 'react-router-dom';
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
  SearchCheck,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/usePermissions';

const mainItems = [
  { icon: LayoutDashboard, label: 'Escritorio', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Wrench, label: 'OTs', path: '/work-orders' },
];

const moreItems = [
  { label: 'Consultar', path: '/consultar', icon: SearchCheck },
  { label: 'Vehículos', path: '/vehicles', icon: Car },
  { label: 'Cotizaciones', path: '/quotes', icon: FileText },
  { label: 'Suscripciones', path: '/subscriptions', icon: Radio },
  { label: 'Vencimientos', path: '/subscriptions/expiring', icon: Radio },
  { label: 'Servicios', path: '/services', icon: Briefcase },
  { label: 'Inventario', path: '/inventory', icon: Package },
  { label: 'Usuarios', path: '/admin/users', icon: UserCog },
  { label: 'Configuración', path: '/settings', icon: Settings },
];

export function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = usePermissions();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const visibleMoreItems = moreItems.filter(
    (item) => item.path !== '/admin/users' || isAdmin
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t bg-card shadow-lg md:hidden"
      style={{
        height: 'var(--bottom-nav-h)',
        zIndex: 'var(--z-header)',
      }}
    >
      <div className="flex items-center justify-around h-full">
        {mainItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1',
              isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}

        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">Más</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[85vh] flex flex-col">
            <SheetHeader className="shrink-0">
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-3 gap-3 pb-6 overflow-y-auto">
              {visibleMoreItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-colors',
                    isActive(item.path)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
