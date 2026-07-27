import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettings, useBulkUpdateSettings } from "@/hooks/useSettings";
import { Loader2, CheckCircle2, XCircle, Map, Bell, MessageSquare, Mail, CreditCard } from "lucide-react";

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
      <CheckCircle2 className="h-3 w-3" /> Configurado
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <XCircle className="h-3 w-3" /> Sin configurar
    </Badge>
  );
}

function IntegrationTab({
  title,
  description,
  icon: Icon,
  keys,
  fields,
  settings,
  isLoading,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  keys: string[];
  fields: { name: string; label: string; placeholder?: string; type?: string; help?: string }[];
  settings: { clave: string; valor: string }[] | undefined;
  isLoading: boolean;
}) {
  const updateSettings = useBulkUpdateSettings();

  const defaultValues = Object.fromEntries(fields.map(f => [f.name, '']));
  const form = useForm({ defaultValues });

  useEffect(() => {
    if (settings) {
      const vals = Object.fromEntries(
        fields.map(f => [f.name, settings.find(s => s.clave === f.name)?.valor ?? ''])
      );
      form.reset(vals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const isConfigured = keys.every(k => {
    const val = settings?.find(s => s.clave === k)?.valor;
    return val && val.length > 0;
  });

  const onSubmit = (values: Record<string, string>) => {
    updateSettings.mutate(values);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <StatusBadge configured={isConfigured} />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(f => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.label}</FormLabel>
                    <FormControl>
                      <Input
                        type={f.type ?? 'text'}
                        placeholder={f.placeholder}
                        {...field}
                      />
                    </FormControl>
                    {f.help && <FormDescription>{f.help}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsSettings() {
  const { data: settings, isLoading } = useSettings();

  const integrations = [
    {
      value: 'mercadopago',
      label: 'MercadoPago',
      icon: CreditCard,
      title: 'MercadoPago',
      description: 'Checkout Pro para cobros en línea de renovaciones GPS',
      keys: ['mp_access_token', 'mp_public_key'],
      fields: [
        {
          name: 'mp_access_token',
          label: 'Access Token',
          placeholder: 'APP_USR-...',
          type: 'password',
          help: 'MercadoPago → Tu negocio → Credenciales → Access Token de producción',
        },
        {
          name: 'mp_public_key',
          label: 'Public Key',
          placeholder: 'APP_USR-...',
          help: 'Clave pública (no secreta) para el SDK cliente',
        },
        {
          name: 'mp_environment',
          label: 'Ambiente',
          placeholder: 'sandbox',
          help: 'Usa "sandbox" para pruebas con credenciales TEST-, y "production" para cobros reales',
        },
      ],
    },
    {
      value: 'mapbox',
      label: 'Mapbox',
      icon: Map,
      title: 'Mapbox',
      description: 'Mapas y geolocalización para direcciones y rutas de técnicos',
      keys: ['mapbox_api_key'],
      fields: [
        { name: 'mapbox_api_key', label: 'API Key', placeholder: 'pk.eyJ...', type: 'password', help: 'Encuéntrala en mapbox.com → Account → Access tokens' },
      ],
    },
    {
      value: 'onesignal',
      label: 'OneSignal',
      icon: Bell,
      title: 'OneSignal',
      description: 'Notificaciones push a dispositivos móviles y navegadores',
      keys: ['onesignal_app_id', 'onesignal_api_key'],
      fields: [
        { name: 'onesignal_app_id', label: 'App ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', help: 'Encuéntralo en OneSignal → Settings → Keys & IDs' },
        { name: 'onesignal_api_key', label: 'API Key (REST)', placeholder: 'os_v2_app_...', type: 'password', help: 'REST API Key de tu aplicación en OneSignal' },
      ],
    },
    {
      value: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      title: 'WhatsApp Business',
      description: 'Mensajería directa a clientes por WhatsApp Business API',
      keys: ['whatsapp_api_url'],
      fields: [
        { name: 'whatsapp_api_url', label: 'API URL', placeholder: 'https://graph.facebook.com/v18.0/...', help: 'URL base de la WhatsApp Business API (Meta)' },
      ],
    },
    {
      value: 'resend',
      label: 'Resend',
      icon: Mail,
      title: 'Resend',
      description: 'Envío de emails transaccionales: recordatorios GPS, OTs y cotizaciones',
      keys: ['resend_api_key'],
      fields: [
        { name: 'resend_api_key', label: 'API Key', placeholder: 're_xxxxxxxxxxxx', type: 'password', help: 'Encuéntrala en resend.com → API Keys' },
        { name: 'resend_from_email', label: 'Email de envío', placeholder: 'notificaciones@autolock.cl', help: 'Debe estar verificado en Resend → Domains' },
        { name: 'resend_from_name', label: 'Nombre del remitente', placeholder: 'AutoLock', help: 'Aparece como "De:" en el email recibido' },
        { name: 'resend_admin_email', label: 'Email de administración', placeholder: 'renovaciones@autolock.cl', help: 'Recibe copia de todos los recordatorios GPS enviados' },
      ],
    },
  ];

  return (
    <div>
      <SettingsHeader
        title="Integraciones"
        description="Configura las conexiones con servicios externos"
      />

      <Tabs defaultValue="resend" orientation="vertical" className="flex gap-6">
        <TabsList className="flex-col h-auto w-40 shrink-0 justify-start bg-muted/50 p-1">
          {integrations.map(i => (
            <TabsTrigger key={i.value} value={i.value} className="w-full justify-start gap-2">
              <i.icon className="h-4 w-4" />
              {i.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 min-w-0">
          {integrations.map(i => (
            <TabsContent key={i.value} value={i.value} className="mt-0">
              <IntegrationTab
                title={i.title}
                description={i.description}
                icon={i.icon}
                keys={i.keys}
                fields={i.fields}
                settings={settings}
                isLoading={isLoading}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
