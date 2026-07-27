import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, Code, Send } from "lucide-react";
import { useUpdateNotificationTemplate } from "@/hooks/useNotificationTemplates";
import { NotificationTemplate } from "@/types/subscriptions";
import { VariablePicker } from "./VariablePicker";
import { TemplatePreview, defaultSampleData } from "./TemplatePreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RichTemplateEditorProps {
  template: NotificationTemplate;
}

function isHtml(s: string) {
  const t = (s || '').trimStart();
  return t.startsWith('<!DOCTYPE') || t.startsWith('<html') || t.startsWith('<HTML');
}

export const RichTemplateEditor = ({ template }: RichTemplateEditorProps) => {
  const updateTemplate = useUpdateNotificationTemplate();
  const [asunto, setAsunto] = useState(template.asunto || "");
  const [cuerpo, setCuerpo] = useState(template.cuerpo);
  const initialIsHtml = isHtml(template.html_content || '') || isHtml(template.cuerpo || '');
  const [htmlContent, setHtmlContent] = useState(
    template.html_content || (isHtml(template.cuerpo || '') ? template.cuerpo : '') || ''
  );
  const [activa, setActiva] = useState(template.activa);
  const [editorMode, setEditorMode] = useState<'text' | 'html'>(initialIsHtml ? 'html' : 'text');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    const ref = editorMode === 'html' ? htmlTextareaRef : textareaRef;
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      const text = editorMode === 'html' ? htmlContent : cuerpo;
      const newText = text.substring(0, start) + variable + text.substring(end);

      if (editorMode === 'html') {
        setHtmlContent(newText);
      } else {
        setCuerpo(newText);
      }

      // Restaurar el foco y posición del cursor
      setTimeout(() => {
        ref.current?.focus();
        ref.current?.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSave = () => {
    updateTemplate.mutate({
      id: template.id,
      asunto,
      cuerpo: editorMode === 'html' ? htmlContent : cuerpo,
      html_content: editorMode === 'html' ? htmlContent : null,
      activa,
    });
  };

  const handleTestSend = async () => {
    const testEmail = prompt('Ingresa el email para enviar prueba:');

    if (!testEmail) return;

    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          evento: template.evento,
          data: defaultSampleData,
          recipient: testEmail
        }
      });

      toast.success('Email de prueba enviado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar email de prueba');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{template.evento}</CardTitle>
            <CardDescription>{template.descripcion}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto del mensaje"
                className="mt-1.5"
              />
            </div>

            <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as 'text' | 'html')}>
              <div className="flex items-center justify-between mb-2">
                <Label>Contenido del Mensaje</Label>
                <TabsList>
                  <TabsTrigger value="text" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Texto
                  </TabsTrigger>
                  <TabsTrigger value="html" className="gap-2">
                    <Code className="h-4 w-4" />
                    HTML
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="text" className="mt-0">
                <Textarea
                  ref={textareaRef}
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  rows={24}
                  placeholder="Contenido del mensaje en texto plano..."
                  className="font-mono text-sm resize-y min-h-[400px]"
                />
              </TabsContent>

              <TabsContent value="html" className="mt-0">
                <Textarea
                  ref={htmlTextareaRef}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={24}
                  placeholder="<p>Contenido HTML del mensaje...</p>"
                  className="font-mono text-sm resize-y min-h-[400px]"
                />
              </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-2">
              <Switch
                id="activa"
                checked={activa}
                onCheckedChange={setActiva}
              />
              <Label htmlFor="activa">Plantilla activa</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleTestSend}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar Prueba
              </Button>

              <Button
                onClick={handleSave}
                disabled={updateTemplate.isPending}
              >
                {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-2">
        <div className="sticky top-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variables Disponibles</CardTitle>
              <CardDescription>
                Haz clic para insertar en el cursor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariablePicker onInsert={handleInsertVariable} />
            </CardContent>
          </Card>

          <TemplatePreview
            asunto={asunto}
            cuerpo={editorMode === 'html' ? htmlContent : cuerpo}
            html_content={editorMode === 'html' ? htmlContent : undefined}
          />
        </div>
      </div>
    </div>
  );
};
