import { Outlet, NavLink } from "react-router-dom";
import { Settings, Building2, Hash, Bell, FileText, Plug, Database, FileBarChart, ListChecks, Monitor } from "lucide-react";

const navigation = [
  { name: 'General', href: '/settings', icon: Settings, end: true },
  { name: 'Empresa', href: '/settings/company', icon: Building2 },
  { name: 'Numeradores', href: '/settings/numeradores', icon: Hash },
  { name: 'Notificaciones', href: '/settings/notifications', icon: Bell },
  { name: 'PDFs', href: '/settings/pdfs', icon: FileText },
  { name: 'Plantillas Checklist', href: '/settings/checklist-templates', icon: ListChecks },
  { name: 'Integraciones', href: '/settings/integrations', icon: Plug },
  { name: 'Respaldos', href: '/settings/backups', icon: Database },
  { name: 'Auditoría', href: '/settings/audit', icon: FileBarChart },
];

export default function SettingsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex gap-6">
          {/* Sidebar fijo */}
          <aside className="hidden md:block w-52 shrink-0">
            <div className="sticky top-6">
              <h2 className="text-lg font-bold mb-3 px-3">Configuración</h2>
              <nav className="space-y-0.5">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* Contenido — ocupa el resto del ancho */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
