import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

const routeNames: Record<string, string> = {
  dashboard: 'Escritorio',
  clients: 'Clientes',
  vehicles: 'Vehículos',
  quotes: 'Cotizaciones',
  'work-orders': 'Órdenes de Trabajo',
  subscriptions: 'Suscripciones GPS',
  inventory: 'Inventario',
  admin: 'Administración',
  users: 'Usuarios',
  settings: 'Configuración',
  new: 'Nuevo',
  edit: 'Editar',
  reports: 'Reportes',
  alerts: 'Alertas',
  plans: 'Planes',
  agenda: 'Agenda',
  company: 'Empresa',
  numeradores: 'Numeradores',
  notifications: 'Notificaciones',
  integrations: 'Integraciones',
  backups: 'Respaldos',
  audit: 'Auditoría',
};

export function AppBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') {
    return null;
  }

  return (
    <div className="border-b bg-card">
      <div className="h-12 px-6 flex items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Inicio</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const label = routeNames[value] || value;

              // Skip UUIDs in breadcrumbs
              if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                return null;
              }

              return (
                <Fragment key={to}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={to}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
