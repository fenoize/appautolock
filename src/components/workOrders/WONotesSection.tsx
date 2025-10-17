import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WONotesSectionProps {
  notas?: string;
  observaciones_cierre?: string;
}

export function WONotesSection({ notas, observaciones_cierre }: WONotesSectionProps) {
  if (!notas && !observaciones_cierre) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No hay notas o instrucciones para esta orden de trabajo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notas && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Instrucciones de Trabajo
          </h3>
          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-foreground whitespace-pre-wrap">{notas}</p>
          </div>
        </div>
      )}

      {observaciones_cierre && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <h4 className="font-semibold mb-1">Observaciones de Cierre</h4>
            <p className="text-sm whitespace-pre-wrap">{observaciones_cierre}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
