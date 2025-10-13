import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart3, FileText, Bell, LogOut, Users, Building, Car, Wrench, Radio, Package, Settings } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const stats = [
    { title: "Clientes", description: "Gestiona tu cartera", icon: Building, count: 0, link: "/clients" },
    { title: "Vehículos", description: "Parque vehicular", icon: Car, count: 0, link: "/vehicles" },
    { title: "Cotizaciones", description: "Pendientes y activas", icon: FileText, count: 0 },
    { title: "Órdenes de Trabajo", description: "OTs programadas", icon: Wrench, count: 0, link: "/work-orders" },
    { title: "Suscripciones GPS", description: "Rastreo vehicular", icon: Radio, count: 0, link: "/subscriptions" },
    { title: "Inventario", description: "Productos y stock", icon: Package, count: 0, link: "/inventory" },
    { title: "Reportes", description: "KPIs y métricas", icon: BarChart3, count: 0, link: "/analytics" },
    { title: "Configuración", description: "Sistema y empresa", icon: Settings, count: 0, link: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Autolock</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>
              <Users className="mr-2 h-4 w-4" />
              Usuarios
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Escritorio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card 
              key={stat.title} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => stat.link && navigate(stat.link)}
            >
              <CardHeader>
                <stat.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{stat.title}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stat.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
