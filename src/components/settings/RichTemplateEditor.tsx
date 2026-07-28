import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Code, Send, Monitor } from "lucide-react";
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
  const t = (s || "").trimStart();
  return t.startsWith("<!DOCTYPE") || t.startsWith("<html") || t.startsWith("<HTML");
}

export const RichTemplateEditor = ({ template }: RichTemplateEditorProps) => {
  const updateTemplate = useUpdateNotificationTemplate();
  const [asunto, setAsunto] = useState(template.asunto || "");
  const [htmlContent, setHtmlContent] = useState(template.html_content || template.cuerpo || "");
  const [activa, setActiva] = useState(template.activa);
  const [tab, setTab] = useState<"visual" | "html">("visual");
  const [sending, setSending] = useState(false);

  const htmlTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variable: string) => {
    const ref = htmlTextareaRef;
    if (ref.current) {
      const start = ref.current.selectionStart;
      const end = ref.current.selectionEnd;
      const newText = htmlContent.substring(0, start) + variable + htmlContent.substring(end);
      setHtmlContent(newText);
      setTimeout(() => {
        ref.current?.focus();
        ref.current?.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setHtmlContent((prev) => prev + variable);
    }
  };

  const handleSave = () => {
    updateTemplate.mutate({
      id: template.id,
      asunto,
      cuerpo: htmlContent,
      html_content: htmlContent,
      activa,
    });
  };

  const handleTestSend = async () => {
    const testEmail = prompt("Ingresa el email para enviar prueba:");
    if (!testEmail) return;

    // Renderizar variables localmente igual que la preview
    const processedSubject = processTemplate(asunto, defaultSampleData);
    const processedBody = processTemplate(htmlContent, defaultSampleData);

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          recipient: testEmail,
          data: {
            subject: processedSubject || `[Prueba] ${template.evento}`,
            body: processedBody,
          },
        },
      });
      if (error) throw error;
      toast.success(`Email de prueba enviado a ${testEmail}`);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar email de prueba");
    } finally {
      setSending(false);
    }
  };

  const processedAsunto = processTemplate(asunto, defaultSampleData);
  const processedHtml = processTemplate(htmlContent, defaultSampleData);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-base">{template.evento}</CardTitle>
          {template.descripcion && <CardDescription>{template.descripcion}</CardDescription>}
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

          {/* Tabs Visual / HTML */}
          <div className="space-y-0">
            <div className="flex items-center justify-between mb-2">
              <Label>Contenido del Mensaje</Label>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTab("visual")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                    tab === "visual" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setTab("html")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l transition-colors ${
                    tab === "html" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  HTML
                </button>
              </div>
            </div>

            {tab === "visual" && (
              <div className="rounded-md border overflow-hidden bg-white" style={{ height: "600px" }}>
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
                  style={{ height: "calc(600px - 36px)" }}
                  sandbox="allow-same-origin"
                />
              </div>
            )}

            {tab === "html" && (
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
          </div>

          {/* Plantilla activa */}
          <div className="flex items-center space-x-2">
            <Switch id="activa" checked={activa} onCheckedChange={setActiva} />
            <Label htmlFor="activa">Plantilla activa</Label>
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleTestSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar Prueba"}
            </Button>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variables — ancho completo, debajo del editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Variables</CardTitle>
          <CardDescription className="text-xs">Clic para insertar en el cursor (pestaña HTML)</CardDescription>
        </CardHeader>
        <CardContent>
          <VariablePicker onInsert={handleInsertVariable} />
        </CardContent>
      </Card>
    </div>
  );
};
