import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wrench, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const mainItems = [
  { icon: LayoutDashboard, label: 'Escritorio', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Wrench, label: 'OTs', path: '/work-orders' },
];

const moreItems = [
  { label: 'Vehículos', path: '/vehicles' },
  { label: 'Cotizaciones', path: '/quotes' },
  { label: 'Suscripciones', path: '/subscriptions' },
  { label: 'Inventario', path: '/inventory' },
  { label: 'Configuración', path: '/settings' },
];

export function AppBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t bg-card shadow-lg md:hidden"
      style={{ 
        height: 'var(--bottom-nav-h)', 
        zIndex: 'var(--z-header)' 
      }}
    >
      <div className="flex items-center justify-around h-full">
        {mainItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1',
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground'
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
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Más opciones</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-2">
              {moreItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(item.path);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
