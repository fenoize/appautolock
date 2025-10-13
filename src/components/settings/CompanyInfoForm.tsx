import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings, useBulkUpdateSettings } from "@/hooks/useSettings";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  razon_social: z.string().min(1, "Razón social requerida"),
  rut: z.string().min(1, "RUT requerido"),
  direccion: z.string().min(1, "Dirección requerida"),
  telefono: z.string().min(1, "Teléfono requerido"),
  email: z.string().email("Email inválido"),
  sitio_web: z.string().optional(),
});

export const CompanyInfoForm = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useBulkUpdateSettings();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razon_social: '',
      rut: '',
      direccion: '',
      telefono: '',
      email: '',
      sitio_web: '',
    },
  });

  useEffect(() => {
    if (settings) {
      const getValue = (key: string) => settings.find(s => s.clave === key)?.valor || '';
      
      form.reset({
        razon_social: getValue('empresa_razon_social'),
        rut: getValue('empresa_rut'),
        direccion: getValue('empresa_direccion'),
        telefono: getValue('empresa_telefono'),
        email: getValue('empresa_email'),
        sitio_web: getValue('empresa_sitio_web'),
      });

      setLogoUrl(getValue('empresa_logo_url'));
    }
  }, [settings, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      
      await supabase
        .from('settings')
        .update({ valor: publicUrl })
        .eq('clave', 'empresa_logo_url');

      toast.success('Logo actualizado');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir logo');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettings.mutate({
      empresa_razon_social: values.razon_social,
      empresa_rut: values.rut,
      empresa_direccion: values.direccion,
      empresa_telefono: values.telefono,
      empresa_email: values.email,
      empresa_sitio_web: values.sitio_web || '',
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
          <div className="flex items-center gap-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-20 w-20 object-contain" />
            )}
            <div>
              <label htmlFor="logo-upload">
                <Button type="button" variant="outline" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Subir Logo
                  </span>
                </Button>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="razon_social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUT</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sitio_web"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio Web</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
