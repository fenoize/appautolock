import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Mail } from "lucide-react";
import { useTemplatesByCategory } from "@/hooks/useNotificationTemplates";
import { RichTemplateEditor } from "./RichTemplateEditor";
import { NotificationTemplate } from "@/types/subscriptions";

const categoryConfig = {
  quote: {
    label: 'Cotizaciones',
    icon: FileText,
    description: 'Notificaciones del proceso de cotizaciones'
  },
  work_order: {
    label: 'Órdenes de Trabajo',
    icon: FileText,
    description: 'Notificaciones de órdenes de trabajo'
  },
  subscription: {
    label: 'Suscripciones',
    icon: Mail,
    description: 'Notificaciones de suscripciones GPS'
  },
  system: {
    label: 'Sistema',
    icon: Mail,
    description: 'Notificaciones del sistema'
  }
};

export const EventAccordion = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);

  return (
    <>
      {selectedTemplate ? (
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedTemplate(null)}
            className="mb-4"
          >
            ← Volver a la lista
          </Button>
          <RichTemplateEditor template={selectedTemplate} />
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <CategorySection
              key={key}
              categoria={key}
              config={config}
              onSelectTemplate={setSelectedTemplate}
            />
          ))}
        </Accordion>
      )}
    </>
  );
};

interface CategorySectionProps {
  categoria: string;
  config: typeof categoryConfig[keyof typeof categoryConfig];
  onSelectTemplate: (template: NotificationTemplate) => void;
}

const CategorySection = ({ categoria, config, onSelectTemplate }: CategorySectionProps) => {
  const { data: templates, isLoading } = useTemplatesByCategory(categoria);
  
  const Icon = config.icon;
  const activeCount = templates?.filter(t => t.activa).length || 0;
  const totalCount = templates?.length || 0;

  if (isLoading) {
    return (
      <AccordionItem value={categoria}>
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span>Cargando...</span>
          </div>
        </AccordionTrigger>
      </AccordionItem>
    );
  }

  return (
    <AccordionItem value={categoria}>
      <AccordionTrigger>
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <h3 className="font-semibold">{config.label}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{activeCount} activos</Badge>
            <Badge variant="outline">{totalCount} total</Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2 pt-2">
          {templates?.map(template => (
            <Button
              key={template.id}
              variant="outline"
              className="w-full justify-between h-auto py-3 px-4"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="text-left">
                <div className="font-medium">{template.evento}</div>
                {template.descripcion && (
                  <div className="text-sm text-muted-foreground">{template.descripcion}</div>
                )}
              </div>
              <Badge variant={template.activa ? "default" : "secondary"}>
                {template.activa ? 'Activo' : 'Inactivo'}
              </Badge>
            </Button>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
