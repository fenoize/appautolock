import { Outlet, NavLink } from "react-router-dom";
import { Settings, Building2, Hash, Bell, FileText, Plug, Database, FileBarChart } from "lucide-react";

const navigation = [
  { name: 'General', href: '/settings', icon: Settings, end: true },
  { name: 'Empresa', href: '/settings/company', icon: Building2 },
  { name: 'Numeradores', href: '/settings/numeradores', icon: Hash },
  { name: 'Notificaciones', href: '/settings/notifications', icon: Bell },
  { name: 'PDFs', href: '/settings/pdfs', icon: FileText },
  { name: 'Integraciones', href: '/settings/integrations', icon: Plug },
  { name: 'Respaldos', href: '/settings/backups', icon: Database },
  { name: 'Auditoría', href: '/settings/audit', icon: FileBarChart },
];

export default function SettingsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6">
              <h2 className="text-2xl font-bold mb-4">Configuración</h2>
              <nav className="space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
