import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processTemplate } from "@/lib/notification-processor";
import { TemplateData } from "@/types/notifications";

interface TemplatePreviewProps {
  asunto: string;
  cuerpo: string;
  html_content?: string;
  sampleData?: TemplateData;
}

export const defaultSampleData: TemplateData = {
  cliente: {
    razon_social: "Transportes ABC S.A.",
    nombre_comercial: "Transportes ABC",
    rut: "12345678-9",
    email_principal: "contacto@abc.cl",
    telefonos: ["+56912345678"]
  },
  vehiculo: {
    patente: "ABCD12",
    marca: "Toyota",
    modelo: "Hilux",
    anio: 2023,
    combustible: "Diesel"
  },
  cotizacion: {
    folio: "COT-2025-0001",
    fecha_emision: new Date().toISOString(),
    validez_dias: 30,
    neto: 450000,
    iva: 85500,
    total: 535500,
    estado: "enviada",
    vendedor_nombre: "Juan Pérez"
  },
  ot: {
    folio: "OT-2025-0001",
    fecha_programada: new Date().toISOString(),
    ventana_inicio: "09:00",
    ventana_fin: "12:00",
    tecnico_nombre: "Carlos Silva",
    estado: "asignada",
    notas: "Cliente prefiere por la mañana",
    direccion: "Av. Principal 123, Santiago"
  },
  suscripcion: {
    folio: "SUB-2025-0001",
    plan_nombre: "Plan GPS Básico",
    fecha_inicio: new Date().toISOString(),
    fecha_vencimiento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    dias_restantes: 15,
    precio: 25000
  },
  sistema: {
    empresa: {
      razon_social: "Mi Empresa S.A.",
      telefono: "+56212345678",
      email: "info@empresa.cl",
      sitio_web: "www.empresa.cl"
    }
  }
};

function isHtmlString(s: string): boolean {
  const trimmed = (s || '').trimStart();
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML');
}

export const TemplatePreview = ({ asunto, cuerpo, html_content, sampleData }: TemplatePreviewProps) => {
  const data = sampleData || defaultSampleData;

  const processedAsunto = processTemplate(asunto, data);
  const processedCuerpo = processTemplate(cuerpo, data);
  const processedHtml = html_content ? processTemplate(html_content, data) : null;

  // Prefer explicit html_content, then fall back to cuerpo if it contains HTML
  const htmlToRender = processedHtml || (isHtmlString(processedCuerpo) ? processedCuerpo : null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Vista Previa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Asunto</p>
          <p className="text-sm font-semibold text-foreground bg-muted/40 rounded px-3 py-2">
            {processedAsunto || <span className="text-muted-foreground italic">Sin asunto</span>}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Correo</p>
          {htmlToRender ? (
            <iframe
              srcDoc={htmlToRender}
              title="Vista previa del correo"
              className="w-full rounded-md border bg-white"
              style={{ height: '480px' }}
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="text-sm whitespace-pre-wrap bg-muted/40 rounded px-3 py-2 text-foreground min-h-[80px]">
              {processedCuerpo || <span className="text-muted-foreground italic">Sin contenido</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
