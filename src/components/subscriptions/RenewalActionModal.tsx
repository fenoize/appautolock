import { useState } from 'react';
import { AlertTriangle, Copy, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface RenewalActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: {
    id: string;
    folio: string;
    fecha_vencimiento: string;
    client?: { razon_social?: string; nombre_comercial?: string; email_principal?: string };
    vehicle?: { patente?: string; marca?: string; modelo?: string };
    plan?: { nombre?: string; precio?: number };
  };
}

export function RenewalActionModal({ open, onOpenChange, subscription }: RenewalActionModalProps) {
  const [sending, setSending] = useState(false);
  const url = `https://portal.autolock.cl/renovar?sub=${subscription.id}`;
  const email = subscription.client?.email_principal;
  const clientName = subscription.client?.razon_social || subscription.client?.nombre_comercial || '-';
  const vencimiento = new Date(subscription.fecha_vencimiento);
  const diasRestantes = Math.ceil((vencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('El cliente no tiene email registrado');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          evento: 'recordatorio_30d',
          recipient: email,
          data: {
            nombre_cliente: clientName,
            folio: subscription.folio,
            fecha_vencimiento: format(vencimiento, 'dd/MM/yyyy'),
            dias_restantes: diasRestantes,
            plan_nombre: subscription.plan?.nombre,
            subscription_id: subscription.id,
            link_renovacion: url,
          },
        },
      });
      if (error) throw error;
      toast.success(`Email enviado a ${email}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar email');
    } finally {
      setSending(false);
    }
  };

  const handleOpenLink = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Suscripción vencida</DialogTitle>
              <DialogDescription>
                Para reactivar, el cliente debe renovar su plan de GPS.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Cliente</p>
            <p className="font-medium">{clientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Patente</p>
            <p className="font-medium">{subscription.vehicle?.patente || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Plan</p>
            <p className="font-medium">{subscription.plan?.nombre || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Precio</p>
            <p className="font-medium">
              ${subscription.plan?.precio?.toLocaleString('es-CL') || '-'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Vencimiento</p>
            <p className="font-medium">{format(vencimiento, 'dd/MM/yyyy')}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Link de renovación para el cliente</p>
          <div className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleOpenLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir link de pago
          </Button>
          <Button onClick={handleSendEmail} disabled={sending || !email}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Enviar link por correo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
