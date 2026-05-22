import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuoteEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { overrideEmail?: string; saveToClient?: boolean }) => void;
  clientEmail?: string;
  isReenvio?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function QuoteEmailDialog({
  open,
  onOpenChange,
  onConfirm,
  clientEmail,
  isReenvio = false,
}: QuoteEmailDialogProps) {
  const hasClientEmail = !!clientEmail && EMAIL_RE.test(clientEmail);
  const [email, setEmail] = useState('');
  const [saveToClient, setSaveToClient] = useState(true);

  useEffect(() => {
    if (open) {
      setEmail('');
      setSaveToClient(true);
    }
  }, [open]);

  const canConfirm = hasClientEmail || EMAIL_RE.test(email.trim());

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (hasClientEmail) {
      onConfirm({});
    } else {
      onConfirm({ overrideEmail: email.trim(), saveToClient });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {isReenvio ? 'Reenviar' : 'Enviar'} Cotización por Email
          </DialogTitle>
          <DialogDescription>
            Confirma el destinatario antes de {isReenvio ? 'reenviar' : 'enviar'} la cotización.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasClientEmail ? (
            <Alert className="border-accent bg-accent/10">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <AlertTitle>Destinatario confirmado</AlertTitle>
              <AlertDescription>
                Se enviará a: <span className="font-medium">{clientEmail}</span>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Este cliente no tiene email registrado</AlertTitle>
                <AlertDescription>
                  Ingresa un email para realizar este envío.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="quote-email-input">Ingresa el email para este envío</Label>
                <Input
                  id="quote-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save-email"
                  checked={saveToClient}
                  onCheckedChange={(v) => setSaveToClient(!!v)}
                />
                <Label htmlFor="save-email" className="text-sm font-normal cursor-pointer">
                  Guardar este email en el cliente
                </Label>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {isReenvio ? 'Reenviar' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
