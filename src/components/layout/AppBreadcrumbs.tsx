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

  return null;
}
