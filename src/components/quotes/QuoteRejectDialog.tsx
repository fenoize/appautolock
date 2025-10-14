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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRejectQuote } from '@/hooks/useQuotes';

interface QuoteRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
}

export function QuoteRejectDialog({
  open,
  onOpenChange,
  quoteId,
}: QuoteRejectDialogProps) {
  const [motivo, setMotivo] = useState('');
  const rejectMutation = useRejectQuote();

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      return;
    }

    await rejectMutation.mutateAsync({
      quoteId,
      motivo,
    });

    onOpenChange(false);
    setMotivo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rechazar Cotización</DialogTitle>
          <DialogDescription>
            Indica el motivo del rechazo de esta cotización.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Rechazo *</Label>
            <Textarea
              id="motivo"
              placeholder="Describe el motivo del rechazo..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setMotivo('');
            }}
            disabled={rejectMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={rejectMutation.isPending || !motivo.trim()}
          >
            {rejectMutation.isPending ? 'Rechazando...' : 'Rechazar Cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
