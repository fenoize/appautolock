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

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('El cliente no tiene email registrado');
      return;
    }
    setSending(true);
    try {
      const planNombre = selectedPlan?.nombre ?? '-';
      const planPrecio = selectedPlan?.precio != null
        ? `$${selectedPlan.precio.toLocaleString('es-CL')}`
        : '-';
      const fechaVenc = format(vencimiento, 'dd/MM/yyyy');
      const LOGO = 'https://autolock.cl/wp-content/uploads/2026/07/autolock_hw.png';

      const makeHeader = (statusBg: string, statusColor: string, title: string, subtitle: string) =>
        `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>` +
        `<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">` +
        `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">` +
        `<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">` +
        `<tr><td style="background:#0f0f0f;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">` +
        `<img src="${LOGO}" alt="AutoLock GPS" height="40" style="display:block;margin:0 auto;">` +
        `</td></tr>` +
        `<tr><td style="background:${statusBg};padding:20px 32px;text-align:center;">` +
        `<p style="margin:0;color:${statusColor};font-size:18px;font-weight:700;">${title}</p>` +
        `<p style="margin:8px 0 0;color:${statusColor};font-size:14px;opacity:0.85;">${subtitle}</p>` +
        `</td></tr>`;

      const infoCard = (rows: [string, string][]) => {
        const cells = rows.map(([label, val], i) =>
          `<tr><td style="padding:6px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #e5e7eb;' : ''}">` +
          `<span style="color:#6b7280;font-size:13px;">${label}</span></td>` +
          `<td style="padding:6px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #e5e7eb;' : ''}text-align:right;">` +
          `<strong style="color:#1a1a1a;font-size:13px;">${val}</strong></td></tr>`
        ).join('');
        return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">` +
          `<tr><td style="padding:16px 20px;"><table width="100%" cellpadding="0" cellspacing="0">${cells}</table></td></tr></table>`;
      };

      const contactAndFooter =
        `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-top:20px;padding-top:20px;">` +
        `<tr><td align="center">` +
        `<p style="margin:0 0 12px;color:#6b7280;font-size:13px;">¿Tienes dudas? Contáctanos</p>` +
        `<a href="https://wa.me/56921783957" style="display:inline-block;background:#25d366;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:6px;margin:0 4px;">WhatsApp</a>` +
        `<a href="mailto:contacto@autolock.cl" style="display:inline-block;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:6px;margin:0 4px;">Correo</a>` +
        `</td></tr></table>` +
        `</td></tr>` +
        `<tr><td style="background:#0f0f0f;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">` +
        `<p style="margin:0;color:#9ca3af;font-size:12px;">AutoLock GPS &mdash; <a href="https://autolock.cl" style="color:#f97316;text-decoration:none;">autolock.cl</a></p>` +
        `<p style="margin:4px 0 0;color:#6b7280;font-size:11px;">Correo generado automáticamente. No responder a este mensaje.</p>` +
        `</td></tr>` +
        `</table></td></tr></table></body></html>`;

      let emailSubject: string;
      let emailBody: string;

      if (planChanged) {
        const header = makeHeader('#d1fae5', '#065f46', 'Plan Actualizado', `${subscription.folio} · ${planNombre}`);
        const card = infoCard([
          ['Folio', subscription.folio],
          ['Nuevo plan', planNombre],
          ['Valor', planPrecio],
          ['Vehículo', subscription.vehicle?.patente || '-'],
        ]);
        const cta =
          `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">` +
          `<a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Pagar y renovar ahora</a>` +
          `</td></tr></table>` +
          `<p style="color:#6b7280;font-size:12px;margin:0 0 20px;text-align:center;word-break:break-all;">Si el botón no funciona, copia este enlace: <a href="${url}" style="color:#f97316;">${url}</a></p>`;

        emailSubject = `Tu suscripción GPS ha sido actualizada — ${subscription.folio}`;
        emailBody =
          header +
          `<tr><td style="background:#ffffff;padding:32px;">` +
          `<p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;">Estimado/a <strong>${clientName}</strong>,</p>` +
          `<p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.7;">Hemos actualizado tu suscripción GPS con el siguiente plan:</p>` +
          card +
          `<p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.7;">Para completar el pago y activar tu suscripción, haz clic en el botón de abajo.</p>` +
          cta +
          contactAndFooter;
      } else {
        const statusBg = diasRestantes <= 1 ? '#fee2e2' : diasRestantes <= 7 ? '#ffedd5' : '#dbeafe';
        const statusColor = diasRestantes <= 1 ? '#dc2626' : diasRestantes <= 7 ? '#c2410c' : '#1e40af';
        const title = diasRestantes <= 1 ? 'URGENTE: Vencimiento Mañana' : diasRestantes <= 7 ? 'Vencimiento Próximo' : 'Recordatorio de Renovación';
        const subtitle = `${subscription.folio} · Vence el ${fechaVenc}`;

        const header = makeHeader(statusBg, statusColor, title, subtitle);
        const card = infoCard([
          ['Folio', subscription.folio],
          ['Plan', planNombre],
          ['Valor', planPrecio],
          ['Vencimiento', fechaVenc],
          ['Días restantes', `${diasRestantes} días`],
          ['Vehículo', subscription.vehicle?.patente || '-'],
        ]);
        const cta =
          `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">` +
          `<a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;">Renovar mi suscripción</a>` +
          `</td></tr></table>` +
          `<p style="color:#6b7280;font-size:12px;margin:0 0 20px;text-align:center;word-break:break-all;">Si el botón no funciona, copia este enlace: <a href="${url}" style="color:#f97316;">${url}</a></p>`;

        emailSubject = `Recordatorio: vencimiento de suscripción GPS ${subscription.folio}`;
        emailBody =
          header +
          `<tr><td style="background:#ffffff;padding:32px;">` +
          `<p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;">Estimado/a <strong>${clientName}</strong>,</p>` +
          `<p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.7;">Te recordamos que tu suscripción GPS vence el <strong>${fechaVenc}</strong> (en <strong>${diasRestantes} días</strong>). Renueva antes de la fecha límite para evitar la interrupción del servicio.</p>` +
          card +
          cta +
          contactAndFooter;
      }

      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          recipient: email,
          evento: planChanged ? 'actualizacion_plan' : 'subscription_expiring_reminder',
          data: { subject: emailSubject, body: emailBody },
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
          <Button onClick={handleSendEmail} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {sending ? 'Enviando...' : 'Enviar link por correo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

}
