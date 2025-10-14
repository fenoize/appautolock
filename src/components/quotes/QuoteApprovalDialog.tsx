import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { useApproveQuoteManually } from '@/hooks/useQuotes';

interface QuoteApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
}

export function QuoteApprovalDialog({
  open,
  onOpenChange,
  quoteId,
}: QuoteApprovalDialogProps) {
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [notas, setNotas] = useState('');
  const approveMutation = useApproveQuoteManually();

  const handleSubmit = async () => {
    // TODO: Implementar subida de comprobante a Storage
    let comprobanteUrl = undefined;
    
    if (comprobante) {
      // Aquí se debería subir el archivo a Supabase Storage
      // Por ahora lo dejamos sin implementar
      console.log('Comprobante a subir:', comprobante);
    }

    await approveMutation.mutateAsync({
      quoteId,
      comprobantePagoUrl: comprobanteUrl,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aprobar Cotización Manualmente</DialogTitle>
          <DialogDescription>
            Confirma la aprobación de esta cotización. Puedes adjuntar un comprobante de pago.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante de Pago (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="comprobante"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {comprobante && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {comprobante.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Agregar notas sobre la aprobación..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
