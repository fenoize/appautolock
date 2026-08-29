import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription, usePauseSubscription, useReactivateSubscription, useCancelSubscription } from '@/hooks/useSubscriptions';
import { usePermissions } from '@/hooks/usePermissions';
import { SubscriptionStatusBadge } from '@/components/subscriptions/SubscriptionStatusBadge';
import { RenewalActionModal } from '@/components/subscriptions/RenewalActionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  RefreshCw, Pause, Play, X, Cpu, Smartphone, User, Settings,
  Copy, Send, Mail, Phone, ExternalLink, CalendarDays, ClipboardList, Archive
} from 'lucide-react';
import { format } from 'date-fns';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function CopyField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success('Copiado');
  };
  return (
    <Field label={label}>
      <div className="flex items-start gap-2">
        <span className={`flex-1 break-all ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
        {value && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copy} title="Copiar">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Field>
  );
}

function getTelefono(client: any): string {
  const t = client?.telefonos;
  if (!t) return '';
  if (Array.isArray(t)) return t.filter(Boolean).join(', ');
  if (typeof t === 'string') {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
    } catch {
      /* plain string */
    }
    return t;
  }
  return String(t);
}

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useSubscription(id!);
  const pauseMutation = usePauseSubscription();
  const reactivateMutation = useReactivateSubscription();
  const cancelMutation = useCancelSubscription();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalModalMode, setRenewalModalMode] = useState<'reactivar' | 'renovar'>('reactivar');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-center py-16 text-muted-foreground">Cargando...</p>
      </PageContainer>
    );
  }
  if (!subscription) {
    return (
      <PageContainer>
        <p className="text-center py-16 text-muted-foreground">Suscripción no encontrada</p>
      </PageContainer>
    );
  }

  const client = subscription.client;
  const clientName = client?.razon_social || client?.nombre_comercial || 'Sin cliente';
  const telefono = getTelefono(client);

  const isExpired = new Date(subscription.fecha_vencimiento) < new Date();
  const handleReactivateClick = () => {
    if (isExpired) {
      setRenewalModalMode('reactivar');
      setShowRenewalModal(true);
    } else {
      reactivateMutation.mutate(subscription.id);
    }
  };

  const openEmailModal = () => {
    setEmailTo(client?.email_principal || '');
    setEmailSubject(`Tus credenciales de acceso GPS — ${subscription.folio}`);
    setEmailBody(
      `Estimado/a ${clientName},\n\n` +
      `A continuación tus credenciales de acceso a la plataforma GPS:\n\n` +
      `Usuario: ${subscription.correo_usuario || '-'}\n` +
      `Contraseña: ${(subscription as any).clave_usuario || '-'}\n\n` +
      `Ingreso a plataforma: ${(subscription as any).enlace_ingreso || '-'}\n` +
      `Descarga de app: ${(subscription as any).enlace_descarga || '-'}\n\n` +
      `Saludos,\nAutoLock GPS`
    );
    setShowEmailModal(true);
  };

  const sendCredentials = async () => {
    if (!emailTo) {
      toast.error('Ingresa un destinatario');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          recipient: emailTo,
          evento: 'credenciales_gps',
          data: { subject: emailSubject, body: emailBody }
        }
      });
      if (error) throw error;
      toast.success('Credenciales enviadas');
      setShowEmailModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar el correo');
    } finally {
      setSending(false);
    }
  };

  const actions = (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:overflow-visible sm:pb-0">
      {(subscription.estado === 'activa' || subscription.estado === 'mora') && (
        <>
          <Button className="shrink-0" onClick={() => { setRenewalModalMode('renovar'); setShowRenewalModal(true); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Renovar
          </Button>
          <Button className="shrink-0" variant="outline" onClick={() => pauseMutation.mutate({ id: subscription.id })}>
            <Pause className="h-4 w-4 mr-2" />
            Pausar
          </Button>
        </>
      )}
      {subscription.estado === 'suspendida' && (
        <Button className="shrink-0" onClick={handleReactivateClick}>
          <Play className="h-4 w-4 mr-2" />
          Reactivar
        </Button>
      )}
      {subscription.estado !== 'cancelada' && (
        <Button className="shrink-0" variant="destructive" onClick={() => cancelMutation.mutate({ id: subscription.id })}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        backButton
        backTo="/subscriptions"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {subscription.folio}
            <SubscriptionStatusBadge status={subscription.estado} />
          </span>
        }
        description="Detalle de la suscripción GPS"
        action={actions}
      />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="gps">Datos GPS</TabsTrigger>
          <TabsTrigger value="timeline">Historial</TabsTrigger>
        </TabsList>

        {/* ---------- INFO ---------- */}
        <TabsContent value="info" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
                <CardDescription>Datos de contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Nombre">
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-primary underline-offset-4 hover:underline text-left"
                  >
                    {clientName}
                  </button>
                </Field>
                <Separator />
                <Field label="Email principal">
                  <span className="break-all">{client?.email_principal || '-'}</span>
                </Field>
                <Separator />
                <Field label="Teléfono">{telefono || '-'}</Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Información General
                </CardTitle>
                <CardDescription>Vehículo y plan contratado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Vehículo">{subscription.vehicle?.patente || 'Sin vehículo asignado'}</Field>
                <Separator />
                <Field label="Plan">{subscription.plan?.nombre || '-'}</Field>
                <Separator />
                <Field label="Precio">
                  {subscription.plan?.precio != null ? `$${subscription.plan.precio.toLocaleString('es-CL')}` : '-'}
                </Field>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                <Field label="Inicio">{format(new Date(subscription.fecha_inicio), 'dd/MM/yyyy')}</Field>
                <Field label="Vencimiento">{format(new Date(subscription.fecha_vencimiento), 'dd/MM/yyyy')}</Field>
                <Field label="Notas">{subscription.notas || '-'}</Field>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- GPS ---------- */}
        <TabsContent value="gps" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Equipo GPS
                </CardTitle>
                <CardDescription>Información técnica del dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Modelo del GPS">{subscription.modelo_gps || '-'}</Field>
                <Separator />
                <CopyField label="IMEI GPS" value={subscription.imei_gps} mono />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Chip / PCS
                </CardTitle>
                <CardDescription>Información del chip de datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CopyField label="IMEI PCS" value={subscription.imei_pcs} mono />
                <Separator />
                <CopyField label="Número PCS" value={subscription.numero_pcs} />
                <Separator />
                <Field label="Compañía">{subscription.compania || '-'}</Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Acceso de Usuario
                </CardTitle>
                <CardDescription>Credenciales y plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Correo Usuario">
                  <span className="break-all">{subscription.correo_usuario || '-'}</span>
                </Field>
                <Separator />
                <Field label="Contraseña GPS">
                  <span className="break-all font-mono">{(subscription as any).clave_usuario || '-'}</span>
                </Field>
                <Separator />
                <Field label="Enlace de ingreso">
                  {(subscription as any).enlace_ingreso ? (
                    <a
                      href={(subscription as any).enlace_ingreso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline break-all"
                    >
                      {(subscription as any).enlace_ingreso}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : '-'}
                </Field>
                <Separator />
                <Field label="Enlace de descarga">
                  {(subscription as any).enlace_descarga ? (
                    <a
                      href={(subscription as any).enlace_descarga}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline break-all"
                    >
                      {(subscription as any).enlace_descarga}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : '-'}
                </Field>
                <Separator />
                <Field label="App Alojada">{subscription.app_alojada || '-'}</Field>
                <Button variant="outline" className="w-full" onClick={openEmailModal}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar credenciales por correo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Servicio
                </CardTitle>
                <CardDescription>Responsable de instalación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Instalador">{subscription.instalador || '-'}</Field>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- TIMELINE ---------- */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Eventos</CardTitle>
              <CardDescription>Registro de cambios y acciones</CardDescription>
            </CardHeader>
            <CardContent>
              {!subscription.events?.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin eventos registrados</p>
              ) : (
                <div className="space-y-4">
                  {subscription.events.map((event) => (
                    <div key={event.id} className="flex gap-4 border-l-2 border-border pl-4 py-2">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{event.tipo.replace('_', ' ')}</p>
                        {event.notas && <p className="text-sm text-muted-foreground">{event.notas}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.fecha), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cliente quick modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{clientName}</DialogTitle>
            <DialogDescription>Información de contacto del cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="break-all">{client?.email_principal || 'Sin email'}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>{telefono || 'Sin teléfono'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowClientModal(false);
                navigate(`/clients/${subscription.client_id}`);
              }}
            >
              Ver perfil completo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email credenciales modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar credenciales por correo</DialogTitle>
            <DialogDescription>Revisa el contenido antes de enviarlo al cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cred-to">Destinatario</Label>
              <Input id="cred-to" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-subject">Asunto</Label>
              <Input id="cred-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-body">Mensaje</Label>
              <Textarea id="cred-body" rows={12} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>Cancelar</Button>
            <Button onClick={sendCredentials} disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RenewalActionModal
        open={showRenewalModal}
        onOpenChange={setShowRenewalModal}
        mode={renewalModalMode}
        subscription={subscription as any}
      />
    </PageContainer>
  );
}
