import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { processTemplate } from "@/lib/notification-processor";
import { TemplateData } from "@/types/notifications";

interface TemplatePreviewProps {
  asunto: string;
  cuerpo: string;
  html_content?: string;
  sampleData?: TemplateData;
}

// Datos de ejemplo por defecto
const defaultSampleData: TemplateData = {
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

export const TemplatePreview = ({ 
  asunto, 
  cuerpo, 
  html_content,
  sampleData 
}: TemplatePreviewProps) => {
  const data = sampleData || defaultSampleData;
  
  const processedAsunto = processTemplate(asunto, data);
  const processedCuerpo = processTemplate(cuerpo, data);
  const processedHtml = html_content ? processTemplate(html_content, data) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vista Previa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Asunto:</label>
          <p className="text-sm mt-1 font-semibold text-foreground">{processedAsunto}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">Cuerpo:</label>
          {processedHtml ? (
            <div 
              className="mt-2 p-4 border rounded-md bg-background"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          ) : (
            <div className="mt-2 p-4 border rounded-md bg-background whitespace-pre-wrap text-sm">
              {processedCuerpo}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
