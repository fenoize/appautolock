import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { toast } from 'sonner';
import { format } from 'date-fns';

const NONE = '__none__';

type Values = {
  client_id: string;
  vehicle_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  email_principal: string;
  correo_usuario: string;
  clave_usuario: string;
  enlace_ingreso: string;
  enlace_descarga: string;
  app_alojada: string;
  modelo_gps: string;
  imei_gps: string;
  imei_pcs: string;
  numero_pcs: string;
  compania: string;
  instalador: string;
  notas: string;
};

const LABELS: Record<keyof Values, string> = {
  client_id: 'Cliente',
  vehicle_id: 'Vehículo',
  plan_id: 'Plan',
  fecha_inicio: 'Fecha de inicio',
  fecha_vencimiento: 'Fecha de vencimiento',
  email_principal: 'Correo principal del cliente',
  correo_usuario: 'Usuario plataforma',
  clave_usuario: 'Clave plataforma',
  enlace_ingreso: 'Enlace de ingreso',
  enlace_descarga: 'Enlace de descarga',
  app_alojada: 'App alojada',
  modelo_gps: 'Modelo GPS',
  imei_gps: 'IMEI GPS',
  imei_pcs: 'IMEI PCS',
  numero_pcs: 'Número PCS',
  compania: 'Compañía',
  instalador: 'Instalador',
  notas: 'Notas',
};

function fromSubscription(sub: any): Values {
  return {
    client_id: sub.client_id || '',
    vehicle_id: sub.vehicle_id || '',
    plan_id: sub.plan_id || '',
    fecha_inicio: sub.fecha_inicio?.slice(0, 10) || '',
    fecha_vencimiento: sub.fecha_vencimiento?.slice(0, 10) || '',
    email_principal: sub.client?.email_principal || '',
    correo_usuario: sub.correo_usuario || '',
    clave_usuario: sub.clave_usuario || '',
    enlace_ingreso: sub.enlace_ingreso || '',
    enlace_descarga: sub.enlace_descarga || '',
    app_alojada: sub.app_alojada || '',
    modelo_gps: sub.modelo_gps || '',
    imei_gps: sub.imei_gps || '',
    imei_pcs: sub.imei_pcs || '',
    numero_pcs: sub.numero_pcs || '',
    compania: sub.compania || '',
    instalador: sub.instalador || '',
    notas: sub.notas || '',
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
  onSaved?: () => void;
}

export function EditSubscriptionDialog({ open, onOpenChange, subscription, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Values>(() => fromSubscription(subscription));
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => fromSubscription(subscription), [subscription]);
  const { data: clients } = useClients();
  const { data: plans } = useSubscriptionPlans(false);
  const { data: vehicles } = useVehiclesByClient(values.client_id);

  useEffect(() => {
    if (open) {
      setValues(fromSubscription(subscription));
      setMotivo('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription?.id]);

  const set = (key: keyof Values, v: string) => setValues(prev => ({ ...prev, [key]: v }));

  const clientLabel = (c: any) => c?.razon_social || c?.nombre_comercial || c?.rut || 'Sin nombre';

  const describeChanges = () => {
    const parts: string[] = [];
    (Object.keys(LABELS) as (keyof Values)[]).forEach(key => {
      const before = initial[key] || '';
      const after = values[key] || '';
      if (before === after) return;
      let b: string = before || '(vacío)';
      let a: string = after || '(vacío)';
      if (key === 'client_id') {
        b = clientLabel(clients?.find((c: any) => c.id === before)) || b;
        a = clientLabel(clients?.find((c: any) => c.id === after)) || a;
      }
      if (key === 'plan_id') {
        b = plans?.find((p: any) => p.id === before)?.nombre || b;
        a = plans?.find((p: any) => p.id === after)?.nombre || a;
      }
      if (key === 'vehicle_id') {
        b = before ? (subscription.vehicle?.id === before ? subscription.vehicle?.patente : before) : '(sin vehículo)';
        a = after ? (vehicles?.find((v: any) => v.id === after)?.patente || after) : '(sin vehículo)';
      }
      if (key === 'clave_usuario') {
        parts.push(`${LABELS[key]}: actualizada`);
        return;
      }
      parts.push(`${LABELS[key]}: ${b} → ${a}`);
    });
    return parts;
  };

  const handleSave = async () => {
    if (!values.client_id || !values.plan_id) {
      toast.error('Cliente y plan son obligatorios');
      return;
    }
    if (!values.fecha_inicio || !values.fecha_vencimiento) {
      toast.error('Ingresa ambas fechas');
      return;
    }
    if (new Date(values.fecha_vencimiento) <= new Date(values.fecha_inicio)) {
      toast.error('El vencimiento debe ser posterior al inicio');
      return;
    }
    if (motivo.trim().length < 5) {
      toast.error('Describe el motivo de la edición');
      return;
    }
    const changes = describeChanges();
    if (changes.length === 0) {
      toast.error('No hay cambios para guardar');
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('subscriptions')
        .update({
          client_id: values.client_id,
          vehicle_id: values.vehicle_id || null,
          plan_id: values.plan_id,
          fecha_inicio: values.fecha_inicio,
          fecha_vencimiento: values.fecha_vencimiento,
          correo_usuario: values.correo_usuario || null,
          clave_usuario: values.clave_usuario || null,
          enlace_ingreso: values.enlace_ingreso || null,
          enlace_descarga: values.enlace_descarga || null,
          app_alojada: values.app_alojada || null,
          modelo_gps: values.modelo_gps || null,
          imei_gps: values.imei_gps || null,
          imei_pcs: values.imei_pcs || null,
          numero_pcs: values.numero_pcs || null,
          compania: values.compania || null,
          instalador: values.instalador || null,
          notas: values.notas || null,
        } as any)
        .eq('id', subscription.id);
      if (error) throw error;

      if (values.email_principal !== initial.email_principal && values.client_id === initial.client_id) {
        const { error: cErr } = await supabase
          .from('clients')
          .update({ email_principal: values.email_principal || null })
          .eq('id', values.client_id);
        if (cErr) throw cErr;
      }

      await supabase.from('subscription_events').insert({
        subscription_id: subscription.id,
        tipo: 'edicion',
        user_id: authData?.user?.id ?? null,
        notas: `Suscripción editada el ${format(new Date(), 'dd/MM/yyyy HH:mm')}. ${changes.join(' | ')}. Motivo: ${motivo.trim()}`,
      });

      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', subscription.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Suscripción actualizada');
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const textField = (key: keyof Values, type = 'text') => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{LABELS[key]}</Label>
      <Input id={key} type={type} value={values[key]} onChange={e => set(key, e.target.value)} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar suscripción {subscription.folio}</DialogTitle>
          <DialogDescription>
            La suscripción está pausada. Modifica los datos necesarios, indica el motivo y luego reactívala.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select
                value={values.client_id}
                onValueChange={v => {
                  set('client_id', v);
                  if (v !== initial.client_id) set('vehicle_id', '');
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{clientLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Vehículo</Label>
              <Select
                value={values.vehicle_id || NONE}
                onValueChange={v => set('vehicle_id', v === NONE ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin vehículo</SelectItem>
                  {vehicles?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.patente} — {v.marca} {v.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={values.plan_id} onValueChange={v => set('plan_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger>
                <SelectContent>
                  {plans?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {textField('email_principal', 'email')}
            {textField('fecha_inicio', 'date')}
            {textField('fecha_vencimiento', 'date')}
          </div>

          <Separator />
          <p className="text-sm font-semibold">Acceso a plataforma</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('correo_usuario')}
            {textField('clave_usuario')}
            {textField('enlace_ingreso')}
            {textField('enlace_descarga')}
            {textField('app_alojada')}
          </div>

          <Separator />
          <p className="text-sm font-semibold">Equipo y chip</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {textField('modelo_gps')}
            {textField('imei_gps')}
            {textField('imei_pcs')}
            {textField('numero_pcs')}
            {textField('compania')}
            {textField('instalador')}
          </div>

          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" rows={2} value={values.notas} onChange={e => set('notas', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivo">Motivo de la edición *</Label>
            <Textarea
              id="motivo"
              rows={2}
              placeholder="Ej: cambio de dueño del vehículo, corrección de fecha mal ingresada..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
