import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSettings, useBulkUpdateSettings } from "@/hooks/useSettings";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  moneda: z.string(),
  iva_porcentaje: z.string(),
  timezone: z.string(),
});

export const SystemPreferencesForm = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useBulkUpdateSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moneda: 'CLP',
      iva_porcentaje: '19',
      timezone: 'America/Santiago',
    },
  });

  useEffect(() => {
    if (settings) {
      const moneda = settings.find(s => s.clave === 'moneda');
      const iva = settings.find(s => s.clave === 'iva_porcentaje');
      const timezone = settings.find(s => s.clave === 'timezone');

      if (moneda || iva || timezone) {
        form.reset({
          moneda: moneda?.valor || 'CLP',
          iva_porcentaje: iva?.valor || '19',
          timezone: timezone?.valor || 'America/Santiago',
        });
      }
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettings.mutate({
      moneda: values.moneda,
      iva_porcentaje: values.iva_porcentaje,
      timezone: values.timezone,
    });
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
            name="moneda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="iva_porcentaje"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IVA (%)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zona Horaria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="America/Santiago">América/Santiago</SelectItem>
                    <SelectItem value="America/New_York">América/Nueva York</SelectItem>
                    <SelectItem value="Europe/Madrid">Europa/Madrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </form>
      </Form>
    </Card>
  );
};
