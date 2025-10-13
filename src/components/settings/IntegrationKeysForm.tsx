import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings, useBulkUpdateSettings } from "@/hooks/useSettings";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  mapbox_api_key: z.string().optional(),
  onesignal_app_id: z.string().optional(),
  onesignal_api_key: z.string().optional(),
  whatsapp_api_url: z.string().optional(),
});

export const IntegrationKeysForm = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useBulkUpdateSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mapbox_api_key: '',
      onesignal_app_id: '',
      onesignal_api_key: '',
      whatsapp_api_url: '',
    },
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string) => settings.find(s => s.clave === key)?.valor || '';
      
      form.reset({
        mapbox_api_key: getValue('mapbox_api_key'),
        onesignal_app_id: getValue('onesignal_app_id'),
        onesignal_api_key: getValue('onesignal_api_key'),
        whatsapp_api_url: getValue('whatsapp_api_url'),
      });
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettings.mutate({
      mapbox_api_key: values.mapbox_api_key || '',
      onesignal_app_id: values.onesignal_app_id || '',
      onesignal_api_key: values.onesignal_api_key || '',
      whatsapp_api_url: values.whatsapp_api_url || '',
    });
  };

  const isConfigured = (key: string) => {
    const value = settings?.find(s => s.clave === key)?.valor;
    return value && value.length > 0;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="mapbox_api_key"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mapbox API Key</FormLabel>
                  {isConfigured('mapbox_api_key') ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <FormControl>
                  <Input type="password" placeholder="pk...." {...field} />
                </FormControl>
                <FormDescription>
                  Para visualización de mapas y geolocalización
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="onesignal_app_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>OneSignal App ID</FormLabel>
                  {isConfigured('onesignal_app_id') ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Para notificaciones push
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="onesignal_api_key"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>OneSignal API Key</FormLabel>
                  {isConfigured('onesignal_api_key') ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp_api_url"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>WhatsApp API URL</FormLabel>
                  {isConfigured('whatsapp_api_url') ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormDescription>
                  URL de la API de WhatsApp Business
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Claves
          </Button>
        </form>
      </Form>
    </Card>
  );
};
