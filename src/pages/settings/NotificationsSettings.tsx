import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventAccordion } from "@/components/settings/EventAccordion";
import { ReminderManager } from "@/components/settings/ReminderManager";
import { NotificationHistory } from "@/components/settings/NotificationHistory";
import { Mail, Bell, History } from "lucide-react";

export default function NotificationsSettings() {
  return (
    <div className="space-y-6">
      <SettingsHeader 
        title="Notificaciones y Templates"
        description="Gestiona plantillas de correo, recordatorios y condiciones de envío"
      />
      
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="h-4 w-4" />
            Recordatorios
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Notificaciones</CardTitle>
              <CardDescription>
                Edita plantillas de email con editor HTML y variables dinámicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventAccordion />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Recordatorios</CardTitle>
              <CardDescription>
                Recordatorios automáticos para eventos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReminderManager />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
