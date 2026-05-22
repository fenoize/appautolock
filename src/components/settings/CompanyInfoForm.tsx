import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings, useBulkUpdateSettings } from "@/hooks/useSettings";
import { Loader2, Upload, X } from "lucide-react";
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

type LogoKey =
  | 'empresa_logo_url'
  | 'empresa_logo_dark_url'
  | 'empresa_favicon_url'
  | 'empresa_favicon_dark_url';

interface LogoConfig {
  key: LogoKey;
  label: string;
  description: string;
  dark?: boolean;
  compact?: boolean;
}

const LOGOS: LogoConfig[] = [
  { key: 'empresa_logo_url', label: 'Logo completo · Claro', description: 'Modo claro · barra superior expandida' },
  { key: 'empresa_logo_dark_url', label: 'Logo completo · Oscuro', description: 'Modo oscuro · barra superior expandida', dark: true },
  { key: 'empresa_favicon_url', label: 'Favicon · Claro', description: 'Modo claro · sidebar colapsado / favicon', compact: true },
  { key: 'empresa_favicon_dark_url', label: 'Favicon · Oscuro', description: 'Modo oscuro · sidebar colapsado / favicon', compact: true, dark: true },
];

interface LogoUploadBoxProps {
  config: LogoConfig;
  url: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}

function LogoUploadBox({ config, url, uploading, onUpload, onClear }: LogoUploadBoxProps) {
  return (
    <div
      className={`rounded-lg border border-border p-4 space-y-3 ${
        config.dark ? 'bg-[#1a1f2e]' : 'bg-muted/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-semibold ${config.dark ? 'text-white' : 'text-foreground'}`}>
            {config.label}
          </p>
          <p className={`text-xs ${config.dark ? 'text-white/60' : 'text-muted-foreground'}`}>
            {config.description}
          </p>
        </div>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClear}
            aria-label="Quitar"
          >
            <X className={`h-3.5 w-3.5 ${config.dark ? 'text-white/70' : ''}`} />
          </Button>
        )}
      </div>

      <div
        className={`h-20 flex items-center justify-center rounded border border-dashed ${
          config.dark ? 'border-white/20' : 'border-border'
        }`}
      >
        {url ? (
          <img
            src={url}
            alt={config.label}
            className={config.compact ? 'h-12 w-12 object-contain' : 'h-12 max-w-[180px] object-contain'}
          />
        ) : (
          <span className={`text-xs ${config.dark ? 'text-white/40' : 'text-muted-foreground'}`}>
            Sin imagen
          </span>
        )}
      </div>

      <label htmlFor={`upload-${config.key}`} className="block">
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild className="w-full">
          <span className="cursor-pointer">
            {uploading ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-2 h-3.5 w-3.5" />
            )}
            {url ? 'Reemplazar' : 'Subir'}
          </span>
        </Button>
      </label>
      <input
        id={`upload-${config.key}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
}

export const CompanyInfoForm = () => {
  const { data: settings, isLoading, refetch } = useSettings();
  const updateSettings = useBulkUpdateSettings();
  const [logos, setLogos] = useState<Record<LogoKey, string>>({
    empresa_logo_url: '',
    empresa_logo_dark_url: '',
    empresa_favicon_url: '',
    empresa_favicon_dark_url: '',
  });
  const [uploadingKey, setUploadingKey] = useState<LogoKey | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razon_social: '', rut: '', direccion: '', telefono: '', email: '', sitio_web: '',
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
      setLogos({
        empresa_logo_url: getValue('empresa_logo_url'),
        empresa_logo_dark_url: getValue('empresa_logo_dark_url'),
        empresa_favicon_url: getValue('empresa_favicon_url'),
        empresa_favicon_dark_url: getValue('empresa_favicon_dark_url'),
      });
    }
  }, [settings, form]);

  const persistLogo = async (key: LogoKey, value: string) => {
    const { error } = await supabase.from('settings').update({ valor: value }).eq('clave', key);
    if (error) throw error;
    setLogos((prev) => ({ ...prev, [key]: value }));
    await refetch();
  };

  const handleUpload = async (key: LogoKey, file: File) => {
    setUploadingKey(key);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('company-assets').getPublicUrl(fileName);
      await persistLogo(key, publicUrl);
      toast.success('Logo actualizado');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir logo');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleClear = async (key: LogoKey) => {
    try {
      await persistLogo(key, '');
      toast.success('Logo eliminado');
    } catch (e: any) {
      toast.error(e.message || 'Error');
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
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Logos de marca</h3>
          <p className="text-sm text-muted-foreground">
            Sube las variantes de tu logo. El header mostrará la versión completa cuando el menú esté
            expandido y el favicon cuando esté colapsado. Cada uno tiene su variante para modo claro y oscuro.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LOGOS.map((cfg) => (
            <LogoUploadBox
              key={cfg.key}
              config={cfg}
              url={logos[cfg.key]}
              uploading={uploadingKey === cfg.key}
              onUpload={(file) => handleUpload(cfg.key, file)}
              onClear={() => handleClear(cfg.key)}
            />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="razon_social" render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="rut" render={({ field }) => (
              <FormItem>
                <FormLabel>RUT</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="direccion" render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="telefono" render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="sitio_web" render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio Web</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
};
