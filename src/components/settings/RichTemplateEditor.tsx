import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, Code } from "lucide-react";
import { useUpdateNotificationTemplate } from "@/hooks/useNotificationTemplates";
import { NotificationTemplate } from "@/types/subscriptions";
import { VariablePicker } from "./VariablePicker";
import { TemplatePreview } from "./TemplatePreview";
import { sanitizeHtml } from "@/lib/notification-processor";

interface RichTemplateEditorProps {
  template: NotificationTemplate;
}

export const RichTemplateEditor = ({ template }: RichTemplateEditorProps) => {
  const updateTemplate = useUpdateNotificationTemplate();
  const [asunto, setAsunto] = useState(template.asunto || "");
  const [cuerpo, setCuerpo] = useState(template.cuerpo);
  const [htmlContent, setHtmlContent] = useState(template.html_content || "");
  const [activa, setActiva] = useState(template.activa);
  const [editorMode, setEditorMode] = useState<'text' | 'html'>('text');
  
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
    const sanitizedHtml = htmlContent ? sanitizeHtml(htmlContent) : null;
    
    updateTemplate.mutate({
      id: template.id,
      asunto,
      cuerpo: editorMode === 'text' ? cuerpo : '',
      html_content: sanitizedHtml,
      activa,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
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
                  rows={12}
                  placeholder="Contenido del mensaje en texto plano..."
                  className="font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="html" className="mt-0">
                <Textarea
                  ref={htmlTextareaRef}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={12}
                  placeholder="<p>Contenido HTML del mensaje...</p>"
                  className="font-mono text-sm"
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

            <Button 
              onClick={handleSave} 
              disabled={updateTemplate.isPending}
              className="w-full"
            >
              {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Plantilla
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
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
          cuerpo={cuerpo}
          html_content={htmlContent}
        />
      </div>
    </div>
  );
};
