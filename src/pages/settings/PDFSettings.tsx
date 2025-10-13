import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PDFSettings() {
  return (
    <div>
      <SettingsHeader 
        title="Plantillas PDF"
        description="Personaliza las plantillas de documentos PDF"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Editor de Plantillas PDF</CardTitle>
          <CardDescription>
            Personaliza el diseño de cotizaciones, órdenes de trabajo e informes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El editor visual de plantillas PDF estará disponible en una próxima actualización.
              Por ahora, las plantillas utilizan el diseño predeterminado del sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
