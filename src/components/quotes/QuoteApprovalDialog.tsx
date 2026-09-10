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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAttachment } from '@/lib/file-validation';

interface QuoteApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
}

// URL firmada de larga duración (~5 años). El bucket es privado.
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24 * 365 * 5;

export function QuoteApprovalDialog({
  open,
  onOpenChange,
  quoteId,
}: QuoteApprovalDialogProps) {
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [notas, setNotas] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const approveMutation = useApproveQuoteManually();
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (file) {
      const validation = validateAttachment(file);
      if (!validation.valid) {
        toast({
          title: 'Archivo no válido',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }
    }
    setComprobante(file);
  };

  const handleSubmit = async () => {
    let comprobanteUrl: string | undefined = undefined;

    if (comprobante) {
      setIsUploading(true);
      try {
        const ext = comprobante.name.split('.').pop();
        const path = `${quoteId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(path, comprobante, { upsert: true });
        if (uploadError) throw uploadError;

        // Bucket privado: generar URL firmada de larga duración
        const { data: signedData, error: signedError } = await supabase.storage
          .from('comprobantes')
          .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);
        if (signedError) throw signedError;
        comprobanteUrl = signedData.signedUrl;
      } catch (error: any) {
        toast({
          title: 'Error al subir comprobante',
          description:
            error?.message ||
            'No se pudo subir el comprobante. La cotización no fue aprobada.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    await approveMutation.mutateAsync({
      quoteId,
      comprobantePagoUrl: comprobanteUrl,
    });

    onOpenChange(false);
  };

  const isBusy = isUploading || approveMutation.isPending;
  const submitLabel = isUploading
    ? 'Subiendo comprobante...'
    : approveMutation.isPending
    ? 'Aprobando...'
    : 'Aprobar Cotización';

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
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
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
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isBusy}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
