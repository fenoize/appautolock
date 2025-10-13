import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotificationTemplates, useUpdateNotificationTemplate } from "@/hooks/useNotificationTemplates";
import { Loader2 } from "lucide-react";

export const NotificationTemplateEditor = () => {
  const { data: templates, isLoading } = useNotificationTemplates();
  const updateTemplate = useUpdateNotificationTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [activa, setActiva] = useState(true);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setAsunto(template.asunto || "");
      setCuerpo(template.cuerpo);
      setActiva(template.activa);
    }
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    
    updateTemplate.mutate({
      id: selectedTemplate,
      asunto,
      cuerpo,
      activa,
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
    <Card>
      <CardHeader>
        <CardTitle>Editor de Plantillas</CardTitle>
        <CardDescription>
          Edita plantillas de notificaciones. Variables disponibles: {"{{nombre}}"}, {"{{folio}}"}, {"{{fecha}}"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Seleccionar Plantilla</Label>
          <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una plantilla" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.evento} - {template.canal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && (
          <>
            <div>
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto del mensaje"
              />
            </div>

            <div>
              <Label htmlFor="cuerpo">Cuerpo del Mensaje</Label>
              <Textarea
                id="cuerpo"
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                rows={8}
                placeholder="Contenido del mensaje..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activa"
                checked={activa}
                onCheckedChange={setActiva}
              />
              <Label htmlFor="activa">Plantilla activa</Label>
            </div>

            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Plantilla
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
