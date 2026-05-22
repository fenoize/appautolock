import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useExpiringSubscriptions, useRenewSubscription } from '@/hooks/useSubscriptions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Mail, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

function urgencyVariant(days: number): { label: string; cls: string } {
  if (days <= 3) return { label: 'Crítico', cls: 'bg-red-500 hover:bg-red-500 text-white' };
  if (days <= 10) return { label: 'Urgente', cls: 'bg-orange-500 hover:bg-orange-500 text-white' };
  return { label: 'Próximo', cls: 'bg-yellow-500 hover:bg-yellow-500 text-black' };
}

export default function SubscriptionExpiring() {
  const navigate = useNavigate();
  const { data: subs, isLoading } = useExpiringSubscriptions(30);
  const { data: plans } = useSubscriptionPlans();
  const renew = useRenewSubscription();

  const [bucket, setBucket] = useState<'all' | 3 | 10 | 30>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [renewTarget, setRenewTarget] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<any | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enriched = useMemo(() => {
    return (subs || []).map((s: any) => ({
      ...s,
      diasRestantes: Math.max(0, differenceInDays(new Date(s.fecha_vencimiento), today)),
    }));
  }, [subs, today]);

  const counts = useMemo(() => ({
    d3: enriched.filter((s) => s.diasRestantes <= 3).length,
    d10: enriched.filter((s) => s.diasRestantes <= 10).length,
    d30: enriched.length,
  }), [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter((s) => {
      if (planFilter !== 'all' && s.plan_id !== planFilter) return false;
      if (bucket === 3 && s.diasRestantes > 3) return false;
      if (bucket === 10 && s.diasRestantes > 10) return false;
      if (bucket === 30 && s.diasRestantes > 30) return false;
      return true;
    });
  }, [enriched, planFilter, bucket]);

  const openEmail = (s: any) => {
    setEmailTarget(s);
    setEmailTo(s.client?.email_principal || '');
    setEmailSubject(`Recordatorio: vencimiento de suscripción GPS ${s.folio}`);
    setEmailBody(
      `Estimado/a ${s.client?.razon_social || s.client?.nombre_comercial || ''},\n\n` +
      `Le recordamos que su suscripción ${s.folio} del plan ${s.plan?.nombre || ''} ` +
      `vence el ${format(new Date(s.fecha_vencimiento), 'dd/MM/yyyy')}.\n\n` +
      `Por favor contáctenos para coordinar la renovación.\n\nSaludos.`
    );
  };

  const sendEmail = async () => {
    if (!emailTarget || !emailTo.trim()) {
      toast.error('Falta el correo destinatario');
      return;
    }
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          recipient: emailTo.trim(),
          subject: emailSubject,
          body: emailBody,
          channel: 'email',
          evento: 'subscription_expiring_reminder',
        },
      });
      if (error) throw error;
      toast.success('Email enviado');
      setEmailTarget(null);
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Vencimientos GPS"
        description="Gestiona suscripciones próximas a vencer y realiza acciones rápidas"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          className={`cursor-pointer border-l-4 border-l-red-500 ${bucket === 3 ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setBucket(bucket === 3 ? 'all' : 3)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Vencen en 3 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{counts.d3}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer border-l-4 border-l-orange-500 ${bucket === 10 ? 'ring-2 ring-orange-500' : ''}`}
          onClick={() => setBucket(bucket === 10 ? 'all' : 10)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Vencen en 10 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{counts.d10}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer border-l-4 border-l-yellow-500 ${bucket === 30 ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setBucket(bucket === 30 ? 'all' : 30)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Vencen en 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{counts.d30}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{filtered.length} resultado(s)</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                {(plans || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay suscripciones que coincidan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Días restantes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => {
                  const u = urgencyVariant(s.diasRestantes);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        {s.client ? (
                          <Link to={`/clients/${s.client_id}`} className="text-primary hover:underline">
                            {s.client.razon_social || s.client.nombre_comercial}
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {s.vehicle ? `${s.vehicle.patente} — ${s.vehicle.marca} ${s.vehicle.modelo}` : '—'}
                      </TableCell>
                      <TableCell>{s.plan?.nombre || '—'}</TableCell>
                      <TableCell>
                        <Badge className={u.cls}>
                          {format(new Date(s.fecha_vencimiento), 'dd MMM yyyy', { locale: es })}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{s.diasRestantes}</span>
                        <span className="text-xs text-muted-foreground ml-1">días</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRenewTarget(s.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" /> Renovar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEmail(s)}>
                            <Mail className="h-4 w-4 mr-1" /> Email
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/subscriptions/${s.id}`)}>
                            <ExternalLink className="h-4 w-4 mr-1" /> Ver
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!renewTarget} onOpenChange={(o) => !o && setRenewTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renovar suscripción</AlertDialogTitle>
            <AlertDialogDescription>
              Se extenderá la fecha de vencimiento según el período del plan. ¿Confirmas la renovación?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!renewTarget) return;
                await renew.mutateAsync(renewTarget);
                setRenewTarget(null);
              }}
            >
              Renovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!emailTarget} onOpenChange={(o) => !o && setEmailTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar recordatorio por email</DialogTitle>
            <DialogDescription>
              Cliente: {emailTarget?.client?.razon_social || emailTarget?.client?.nombre_comercial}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="exp-email-to">Destinatario</Label>
              <Input id="exp-email-to" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-email-subj">Asunto</Label>
              <Input id="exp-email-subj" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-email-body">Mensaje</Label>
              <Textarea id="exp-email-body" rows={8} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailTarget(null)}>Cancelar</Button>
            <Button onClick={sendEmail} disabled={sendingEmail}>
              {sendingEmail ? 'Enviando…' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
