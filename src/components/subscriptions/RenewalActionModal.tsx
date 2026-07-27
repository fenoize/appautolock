import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Copy, Mail, ExternalLink, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';


interface RenewalActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'reactivar' | 'renovar';
  subscription: {
    id: string;
    folio: string;
    fecha_vencimiento: string;
    client?: { razon_social?: string; nombre_comercial?: string; email_principal?: string };
    vehicle?: { patente?: string; marca?: string; modelo?: string };
    plan?: { id?: string; nombre?: string; precio?: number };
  };
}

export function RenewalActionModal({ open, onOpenChange, subscription, mode = 'reactivar' }: RenewalActionModalProps) {
  const [sending, setSending] = useState(false);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const email = subscription.client?.email_principal;
  const clientName = subscription.client?.razon_social || subscription.client?.nombre_comercial || '-';
  const vencimiento = new Date(subscription.fecha_vencimiento);
  const diasRestantes = Math.ceil((vencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, nombre, precio, periodo_meses')
        .eq('activo', true)
        .order('precio', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string>(subscription.plan?.id ?? '');
  const selectedPlan = plans?.find(p => p.id === selectedPlanId) ?? subscription.plan;
  const url = `${window.location.origin}/renovar?sub=${subscription.id}&plan=${selectedPlanId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const planChanged = selectedPlanId !== (subscription.plan?.id ?? '');

  const openEmailCompose = () => {
    const planNombre = selectedPlan?.nombre ?? '-';
    const planPrecio = selectedPlan?.precio != null ? selectedPlan.precio.toLocaleString('es-CL') : '-';

    const header = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
      <tr><td style="background:#f97316;padding:30px 40px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;letter-spacing:1px;">AutoLock GPS</h1>
        <p style="color:#fed7aa;margin:8px 0 0;font-size:13px;">Sistema de Electroseguridad Automotriz</p>
      </td></tr>`;

    const footer = `
      <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 AutoLock GPS · Electroseguridad Automotriz</p>
        <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">contacto@autolock.cl · +56 9 2178 3957</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

    setEmailTo(email || '');

    if (planChanged) {
      setEmailSubject(`Tu suscripción GPS ha sido actualizada — ${subscription.folio}`);
      setEmailBody(`${header}
      <tr><td style="padding:40px;">
        <p style="color:#374151;font-size:15px;margin:0 0 20px;">Estimado/a <strong>${clientName}</strong>,</p>
        <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hemos actualizado tu suscripción GPS con el siguiente plan:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;margin:0 0 24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#9a3412;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Detalle de la actualización</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Folio</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${subscription.folio}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Plan</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${planNombre}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Valor</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">$${planPrecio}</td></tr>
            </table>
          </td></tr>
        </table>
        <p style="color:#374151;font-size:15px;margin:0 0 24px;">Para completar el pago y activar tu suscripción, haz clic en el siguiente botón:</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
          <tr><td align="center" style="background:#f97316;border-radius:6px;padding:14px 32px;">
            <a href="${url}" style="color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Pagar y renovar ahora</a>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Si el botón no funciona, copia este enlace:</p>
        <p style="color:#f97316;font-size:12px;margin:0 0 28px;word-break:break-all;">${url}</p>
        <p style="color:#374151;font-size:14px;margin:0;">Si tienes consultas, contáctanos por WhatsApp o al <strong>+56 9 2178 3957</strong>.</p>
      </td></tr>${footer}`);
    } else {
      const boxBg = diasRestantes <= 1 ? '#fee2e2' : diasRestantes <= 7 ? '#fefce8' : '#fff7ed';
      const boxBorder = diasRestantes <= 1 ? '#fca5a5' : diasRestantes <= 7 ? '#fde68a' : '#fed7aa';
      const fechaVenc = format(vencimiento, 'dd/MM/yyyy');

      setEmailSubject(`Recordatorio: vencimiento de suscripción GPS ${subscription.folio}`);
      setEmailBody(`${header}
      <tr><td style="padding:40px;">
        <p style="color:#374151;font-size:15px;margin:0 0 20px;">Estimado/a <strong>${clientName}</strong>,</p>
        <p style="color:#374151;font-size:15px;margin:0 0 24px;">Le recordamos que su suscripción GPS (folio: <strong>${subscription.folio}</strong>) del plan "<strong>${planNombre}</strong>" vencerá el <strong>${fechaVenc}</strong>, en <strong>${diasRestantes} días</strong>.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${boxBg};border:1px solid ${boxBorder};border-radius:6px;margin:0 0 24px;">
          <tr><td style="padding:20px;">
            <p style="margin:0 0 8px;color:#9a3412;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Detalle de la suscripción</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Folio</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${subscription.folio}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Plan</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${planNombre}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Vencimiento</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${fechaVenc}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280;font-size:14px;">Días restantes</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${diasRestantes} días</td></tr>
            </table>
          </td></tr>
        </table>
        <p style="color:#374151;font-size:15px;margin:0 0 24px;">Para renovar en línea, haz clic en el siguiente botón:</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
          <tr><td align="center" style="background:#f97316;border-radius:6px;padding:14px 32px;">
            <a href="${url}" style="color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Renovar mi suscripción</a>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Si el botón no funciona, copia este enlace:</p>
        <p style="color:#f97316;font-size:12px;margin:0 0 28px;word-break:break-all;">${url}</p>
        <p style="color:#374151;font-size:14px;margin:0;">Si tiene consultas, contáctenos por WhatsApp o al <strong>+56 9 2178 3957</strong>.</p>
      </td></tr>${footer}`);
    }
    setShowEmailCompose(true);
  };


  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error('Ingresa un destinatario');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          recipient: emailTo,
          evento: planChanged ? 'actualizacion_plan' : 'subscription_expiring_reminder',
          data: { subject: emailSubject, body: emailBody },
        },
      });
      if (error) throw error;
      toast.success(`Email enviado a ${emailTo}`);
      setShowEmailCompose(false);
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
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              mode === 'renovar' ? "bg-primary/10" : "bg-orange-100 dark:bg-orange-950"
            )}>
              {mode === 'renovar' ? (
                <RefreshCw className="h-5 w-5 text-primary" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div>
              <DialogTitle>
                {mode === 'renovar' ? 'Renovar suscripción' : 'Suscripción vencida'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'renovar'
                  ? 'Selecciona el plan y envía el link de pago al cliente.'
                  : 'Para reactivar, el cliente debe renovar su plan de GPS.'}
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

        <div className="space-y-2">
          <p className="text-sm font-medium">Plan de renovación</p>
          <div className="grid gap-2">
            {plansLoading && (
              <div className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Cargando planes...</span>
              </div>
            )}
            {plans?.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 text-sm transition-colors text-left",
                  selectedPlanId === plan.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div>
                  <p className="font-medium">{plan.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.periodo_meses === 1 ? '1 mes' : `${plan.periodo_meses} meses`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">${plan.precio.toLocaleString('es-CL')}</span>
                  {selectedPlanId === plan.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              </button>
            ))}
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
          <Button onClick={openEmailCompose}>
            <Mail className="mr-2 h-4 w-4" />
            Enviar link por correo
          </Button>
        </div>

        <Dialog open={showEmailCompose} onOpenChange={setShowEmailCompose}>
          <DialogContent className="z-[60] max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar correo al cliente</DialogTitle>
              <DialogDescription>Revisa y edita el mensaje antes de enviarlo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="renewal-email-to">Destinatario</Label>
                <Input id="renewal-email-to" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="renewal-email-subject">Asunto</Label>
                <Input id="renewal-email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="renewal-email-body">Mensaje</Label>
                <Textarea id="renewal-email-body" rows={10} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowEmailCompose(false)}>Cancelar</Button>
              <Button onClick={handleSendEmail} disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );

}
