import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, Code, Send, Monitor } from "lucide-react";
import { useUpdateNotificationTemplate } from "@/hooks/useNotificationTemplates";
import { NotificationTemplate } from "@/types/subscriptions";
import { VariablePicker } from "./VariablePicker";
import { defaultSampleData } from "./TemplatePreview";
import { processTemplate } from "@/lib/notification-processor";
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
  const [cuerpo, setCuerpo] = useState(template.cuerpo || "");

  const initialIsHtml = isHtml(template.html_content || '') || isHtml(template.cuerpo || '');
  const [htmlContent, setHtmlContent] = useState(
    template.html_content || (isHtml(template.cuerpo || '') ? template.cuerpo : '') || ''
  );
  const [activa, setActiva] = useState(template.activa);

  // Tabs: "visual" | "html" | "text"
  const [tab, setTab] = useState<'visual' | 'html' | 'text'>(
    initialIsHtml ? 'visual' : 'text'
  );

  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isHtmlMode = tab === 'html' || tab === 'visual';

  const handleInsertVariable = (variable: string) => {
    const ref = tab === 'html' ? htmlTextareaRef : textareaRef;
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      const text = tab === 'html' ? htmlContent : cuerpo;
      const newText = text.substring(0, start) + variable + text.substring(end);
      if (tab === 'html') {
        setHtmlContent(newText);
      } else {
        setCuerpo(newText);
      }
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
      cuerpo: isHtmlMode ? htmlContent : cuerpo,
      html_content: isHtmlMode ? htmlContent : null,
      activa,
    });
  };

  const handleTestSend = async () => {
    const testEmail = prompt('Ingresa el email para enviar prueba:');
    if (!testEmail) return;
    try {
      await supabase.functions.invoke('send-notification', {
        body: { evento: template.evento, data: defaultSampleData, recipient: testEmail }
      });
      toast.success('Email de prueba enviado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar email de prueba');
    }
  };

  // Preview con datos de ejemplo sustituidos
  const processedAsunto = processTemplate(asunto, defaultSampleData);
  const processedHtml = processTemplate(htmlContent, defaultSampleData);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Editor principal — 3/4 del ancho */}
      <div className="xl:col-span-3 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-base">{template.evento}</CardTitle>
            {template.descripcion && (
              <CardDescription>{template.descripcion}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Asunto */}
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

            {/* Tabs Visual / HTML / Texto */}
            <div className="space-y-0">
              <div className="flex items-center justify-between mb-2">
                <Label>Contenido del Mensaje</Label>
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTab('visual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                      tab === 'visual'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('html')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l transition-colors ${
                      tab === 'html'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l transition-colors ${
                      tab === 'text'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Texto
                  </button>
                </div>
              </div>

              {/* Visual: iframe preview dentro del editor */}
              {tab === 'visual' && (
                <div className="rounded-md border overflow-hidden bg-white" style={{ height: '600px' }}>
                  <div className="bg-muted/60 border-b px-3 py-1.5 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Vista previa con datos de ejemplo</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground font-mono truncate">{processedAsunto}</span>
                  </div>
                  <iframe
                    key={htmlContent}
                    srcDoc={processedHtml}
                    title="Vista previa del correo"
                    className="w-full"
                    style={{ height: 'calc(600px - 36px)' }}
                    sandbox="allow-same-origin"
                  />
                </div>
              )}

              {/* HTML: textarea editor */}
              {tab === 'html' && (
                <Textarea
                  ref={htmlTextareaRef}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={26}
                  placeholder="<p>Contenido HTML del mensaje...</p>"
                  className="font-mono text-sm resize-y min-h-[500px]"
                  spellCheck={false}
                />
              )}

              {/* Texto plano */}
              {tab === 'text' && (
                <Textarea
                  ref={textareaRef}
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  rows={26}
                  placeholder="Contenido del mensaje en texto plano..."
                  className="text-sm resize-y min-h-[500px]"
                />
              )}
            </div>

            {/* Plantilla activa */}
            <div className="flex items-center space-x-2">
              <Switch id="activa" checked={activa} onCheckedChange={setActiva} />
              <Label htmlFor="activa">Plantilla activa</Label>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleTestSend} className="gap-2">
                <Send className="h-4 w-4" />
                Enviar Prueba
              </Button>
              <Button onClick={handleSave} disabled={updateTemplate.isPending}>
                {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel lateral — solo variables */}
      <div className="xl:col-span-1">
        <div className="sticky top-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Variables</CardTitle>
              <CardDescription className="text-xs">
                Clic para insertar en el cursor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VariablePicker onInsert={handleInsertVariable} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
