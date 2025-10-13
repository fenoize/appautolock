import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { NotificationTemplateEditor } from "@/components/settings/NotificationTemplateEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReminderSettings } from "@/hooks/useNotificationTemplates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function NotificationsSettings() {
  const { data: reminders } = useReminderSettings();

  return (
    <div>
      <SettingsHeader 
        title="Notificaciones"
        description="Gestiona plantillas de notificaciones y recordatorios"
      />
      
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-6">
          <NotificationTemplateEditor />
        </TabsContent>
        
        <TabsContent value="reminders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Recordatorios</CardTitle>
              <CardDescription>
                Recordatorios automáticos para eventos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Días Previos</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders?.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>{reminder.evento}</TableCell>
                      <TableCell>{reminder.dias_previos}</TableCell>
                      <TableCell>{reminder.canal_preferido}</TableCell>
                      <TableCell>
                        <Badge variant={reminder.activo ? "default" : "secondary"}>
                          {reminder.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
