import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { IntegrationKeysForm } from "@/components/settings/IntegrationKeysForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IntegrationsSettings() {
  return (
    <div>
      <SettingsHeader 
        title="Integraciones"
        description="Configura las integraciones con servicios externos"
      />
      
      <div className="space-y-6">
        <IntegrationKeysForm />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapbox</CardTitle>
              <CardDescription>Mapas y geolocalización</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mapbox proporciona mapas interactivos y servicios de geolocalización para visualizar
                direcciones de clientes y rutas de técnicos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OneSignal</CardTitle>
              <CardDescription>Notificaciones push</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                OneSignal permite enviar notificaciones push a dispositivos móviles y navegadores
                para mantener informados a usuarios y técnicos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business</CardTitle>
              <CardDescription>Mensajería instantánea</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Integración con WhatsApp Business API para enviar notificaciones y recordatorios
                directamente a WhatsApp.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
