import { useState, useEffect, useRef } from 'react';
import SignaturePad from 'react-signature-canvas';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { WorkOrder } from '@/types/workOrders';
import { useCloseWorkOrder } from '@/hooks/useWorkOrders';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WOStatusBadge } from './WOStatusBadge';
import { WOTipoBadge } from './WOTipoBadge';
import { WOSubscriptionConfig } from './WOSubscriptionConfig';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AssignTechnicianDialog } from './AssignTechnicianDialog';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  Car,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  UserPlus,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'info' | 'checklist' | 'revision' | 'equipos' | 'confirmacion' | 'firma' | 'cierre';
const STEPS: Step[] = ['info', 'checklist', 'revision', 'equipos', 'confirmacion', 'firma', 'cierre'];
const LABELS: Record<Step, string> = {
  info: 'Información',
  checklist: 'Checklist',
  revision: 'Revisión',
  equipos: 'Equipos',
  confirmacion: 'Confirmación',
  firma: 'Firma',
  cierre: 'Cierre',
};

interface Props {
  wo: WorkOrder;
}

export default function MobileWODetail({ wo }: Props) {
  const productIds = (wo?.items ?? [])
    .filter((i) => i.item_tipo === 'producto' && i.ref_id)
    .map((i) => i.ref_id as string);

  const { data: productsSerializable } = useQuery({
    queryKey: ['products-serializable', productIds],
    queryFn: async () => {
      if (!productIds.length) return [];
      const { data } = await supabase
        .from('products')
        .select('id, serializable')
        .in('id', productIds);
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  const serializableIds = new Set(
    (productsSerializable ?? []).filter((p) => p.serializable).map((p) => p.id)
  );

  const navigate = useNavigate();
  const closeWO = useCloseWorkOrder();
  const { isAdmin, hasRole } = usePermissions();
  const isSupervisor = hasRole('operador');
  const isTecnico = hasRole('tecnico');
  const canManage = isAdmin || isSupervisor;
  const [step, setStep] = useState<Step>('info');
  const [checklistItems, setChecklistItems] = useState(wo.checklist_data?.items || []);
  const [revisionData, setRevisionData] = useState<{
    externa: { urls: string[]; comentario: string };
    interna: { urls: string[]; comentario: string };
  }>(
    wo.revision_data ?? {
      externa: { urls: [], comentario: '' },
      interna: { urls: [], comentario: '' },
    },
  );
  const [confirmacionData, setConfirmacionData] = useState<{
    urls: string[];
    comentario: string;
  }>(wo.confirmacion_data ?? { urls: [], comentario: '' });
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [techLocationId, setTechLocationId] = useState<string | null>(null);
  const [techSerials, setTechSerials] = useState<{ id: string; serial_number: string; product_id: string }[]>([]);
  const [serialSelections, setSerialSelections] = useState<Record<string, string>>({});
  const [confirmedSerials, setConfirmedSerials] = useState<Record<string, string>>(
    Object.fromEntries(
      (wo.items ?? [])
        .filter((i) => i.serial_instalado)
        .map((i) => [i.id, i.serial_instalado!])
    )
  );
  const [confirmingSerial, setConfirmingSerial] = useState<string | null>(null);
  const [manualSerials, setManualSerials] = useState<Record<string, string>>({});
  const [serialDefectuoso, setSerialDefectuoso] = useState<Record<string, string>>({});
  const [firmaData, setFirmaData] = useState<string>('');
  const [firmaNombre, setFirmaNombre] = useState<string>('');
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const sigPadRef = useRef<any>(null);
  const [observaciones, setObservaciones] = useState<string>(wo.observaciones_cierre || '');
  const [assignOpen, setAssignOpen] = useState(false);
  const [gpsConfirmado, setGpsConfirmado] = useState(false);
  const [selectedSubscriptionItem, setSelectedSubscriptionItem] = useState<any>(null);

  const { data: subscriptionItems = [] } = useQuery({
    queryKey: ['wo-subscription-items', wo.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wo_subscription_items')
        .select('*')
        .eq('wo_id', wo.id);
      return data || [];
    },
    enabled: !!wo.id,
  });

  const pendingGPS = (subscriptionItems as any[]).filter((si) => !si.subscription_id);

  useEffect(() => {
    if (step !== 'equipos') return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: loc } = await supabase
        .from('stock_locations')
        .select('id')
        .eq('tipo', 'camioneta')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!loc) return;
      setTechLocationId(loc.id);

      const { data: serials } = await supabase
        .from('product_serials')
        .select('id, serial_number, product_id')
        .eq('location_id', loc.id)
        .eq('estado', 'reservado');

      setTechSerials(serials || []);
    };
    load();
  }, [step]);

  const stepIdx = STEPS.indexOf(step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const goNext = () => stepIdx < STEPS.length - 1 && setStep(STEPS[stepIdx + 1]);
  const goPrev = () => stepIdx > 0 && setStep(STEPS[stepIdx - 1]);

  const requiredDone = checklistItems
    .filter((i: any) => i.requerido)
    .every((i: any) => i.completado);
  const completados = checklistItems.filter((i: any) => i.completado).length;

  const toggleChecklistItem = (id: string) => {
    setChecklistItems((prev: any[]) =>
      prev.map((i) => (i.id === id ? { ...i, completado: !i.completado } : i)),
    );
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: 'externa' | 'interna' | 'confirmacion',
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingSection(section);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${wo.id}/${section}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('wo-evidencias').upload(path, file);
        if (upErr) throw upErr;
        const {
          data: { publicUrl },
        } = supabase.storage.from('wo-evidencias').getPublicUrl(path);
        uploaded.push(publicUrl);
      }

      if (section === 'confirmacion') {
        const updated = { ...confirmacionData, urls: [...confirmacionData.urls, ...uploaded] };
        setConfirmacionData(updated);
        await supabase
          .from('work_orders')
          .update({ confirmacion_data: updated } as any)
          .eq('id', wo.id);
      } else {
        const updated = {
          ...revisionData,
          [section]: { ...revisionData[section], urls: [...revisionData[section].urls, ...uploaded] },
        };
        setRevisionData(updated);
        await supabase
          .from('work_orders')
          .update({ revision_data: updated } as any)
          .eq('id', wo.id);
      }
      toast.success(`${uploaded.length} foto(s) subida(s)`);
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploadingSection(null);
      e.target.value = '';
    }
  };

  const saveRevisionComment = async (section: 'externa' | 'interna', comentario: string) => {
    const updated = { ...revisionData, [section]: { ...revisionData[section], comentario } };
    setRevisionData(updated);
    await supabase
      .from('work_orders')
      .update({ revision_data: updated } as any)
      .eq('id', wo.id);
  };

  const saveConfirmacionComment = async (comentario: string) => {
    const updated = { ...confirmacionData, comentario };
    setConfirmacionData(updated);
    await supabase
      .from('work_orders')
      .update({ confirmacion_data: updated } as any)
      .eq('id', wo.id);
  };

  const removePhoto = async (section: 'externa' | 'interna' | 'confirmacion', url: string) => {
    if (section === 'confirmacion') {
      const updated = { ...confirmacionData, urls: confirmacionData.urls.filter((u) => u !== url) };
      setConfirmacionData(updated);
      await supabase
        .from('work_orders')
        .update({ confirmacion_data: updated } as any)
        .eq('id', wo.id);
    } else {
      const updated = {
        ...revisionData,
        [section]: {
          ...revisionData[section],
          urls: revisionData[section].urls.filter((u) => u !== url),
        },
      };
      setRevisionData(updated);
      await supabase
        .from('work_orders')
        .update({ revision_data: updated } as any)
        .eq('id', wo.id);
    }
  };

  const handleConfirmSerial = async (woItemId: string) => {
    const serial = serialSelections[woItemId];
    if (!serial || !techLocationId) return;
    setConfirmingSerial(woItemId);
    try {
      const { error: itemErr } = await supabase
        .from('wo_items')
        .update({ serial_instalado: serial, serial_verificado: true })
        .eq('id', woItemId);
      if (itemErr) throw itemErr;

      const { error: serialErr } = await supabase
        .from('product_serials')
        .update({ estado: 'vendido' })
        .eq('serial_number', serial)
        .eq('location_id', techLocationId);
      if (serialErr) throw serialErr;

      setConfirmedSerials((prev) => ({ ...prev, [woItemId]: serial }));
      setTechSerials((prev) => prev.filter((s) => s.serial_number !== serial));
      toast.success(`Serial ${serial} confirmado`);
    } catch {
      toast.error('Error al confirmar serial');
    } finally {
      setConfirmingSerial(null);
    }
  };

  const handleMarkDefectuoso = async (woItemId: string, rawSerial: string) => {
    const serial = (rawSerial || '').trim().toUpperCase();
    if (!serial) return;
    try {
      const { error } = await supabase
        .from('product_serials')
        .update({ estado: 'defectuoso' })
        .eq('serial_number', serial);
      if (error) throw error;
      toast.success(`Serial ${serial} marcado como defectuoso`);
    } catch {
      toast.error('Error al marcar el serial como defectuoso');
    }
  };

  const handleConfirmManualSerial = async (woItemId: string, itemRefId: string | null | undefined) => {
    const serial = (manualSerials[woItemId] || '').trim().toUpperCase();
    if (!serial) return;
    setConfirmingSerial(woItemId);
    try {
      // Verificar si el serial ya existe en el sistema
      const { data: existing } = await supabase
        .from('product_serials')
        .select('id')
        .eq('serial_number', serial)
        .maybeSingle();

      if (existing) {
        // Actualizar estado a 'vendido'
        await supabase
          .from('product_serials')
          .update({ estado: 'vendido' })
          .eq('serial_number', serial);
      } else if (itemRefId) {
        // Crear nuevo registro de serial
        await supabase
          .from('product_serials')
          .insert({
            serial_number: serial,
            product_id: itemRefId,
            estado: 'vendido',
            location_id: techLocationId,
          });
      }

      // Vincular serial al wo_item
      await supabase
        .from('wo_items')
        .update({ serial_instalado: serial, serial_verificado: true })
        .eq('id', woItemId);

      setConfirmedSerials((prev) => ({ ...prev, [woItemId]: serial }));
      toast.success(`Serial ${serial} registrado correctamente`);
    } catch {
      toast.error('Error al registrar serial');
    } finally {
      setConfirmingSerial(null);
    }
  };

  const handleClose = async () => {
    if (!firmaData || !firmaNombre) {
      toast.error('Falta la firma del cliente');
      setStep('firma');
      return;
    }
    try {
      await closeWO.mutateAsync({
        wo_id: wo.id,
        checklist_data: { ...wo.checklist_data, items: checklistItems },
        observaciones_cierre: observaciones,
        firma_data: firmaData,
        firma_nombre: firmaNombre,
      });
      navigate('/work-orders');
    } catch (e) {
      // toast handled
    }
  };

  const mapsLink = wo.direccion
    ? `https://google.com/maps?q=${encodeURIComponent(
        [wo.direccion, wo.comuna, wo.region].filter(Boolean).join(', '),
      )}`
    : null;

  

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Top progress bar */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> OTs
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{wo.folio}</span>
            <WOTipoBadge tipo={(wo as any).tipo} />
          </div>
          <WOStatusBadge status={wo.estado} />
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wide">
          {STEPS.map((s, i) => (
            <span key={s} className={i === stepIdx ? 'text-primary font-semibold' : ''}>
              {LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {step === 'info' && (
          <>
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserIcon className="h-4 w-4" /> Cliente
              </div>
              <div>
                <p className="font-medium">{wo.client?.razon_social || '—'}</p>
                {(wo.client as any)?.telefonos?.[0] && (
                  <a
                    href={`tel:${(wo.client as any).telefonos[0]}`}
                    className="inline-flex items-center gap-1 text-primary text-sm mt-1"
                  >
                    <Phone className="h-3.5 w-3.5" /> {(wo.client as any).telefonos[0]}
                  </a>
                )}
              </div>
            </Card>

            {wo.vehicle && (
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Car className="h-4 w-4" /> Vehículo
                </div>
                <p className="text-sm">
                  {wo.vehicle.marca} {wo.vehicle.modelo}
                  {(wo.vehicle as any).color ? ` · ${(wo.vehicle as any).color}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">Patente: {wo.vehicle.patente}</p>
              </Card>
            )}

            {(wo.direccion || wo.ubicacion_manual) && (
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4" /> Dirección
                </div>
                <p className="text-sm">
                  {wo.direccion || wo.ubicacion_manual}
                  {wo.comuna ? `, ${wo.comuna}` : ''}
                </p>
                {mapsLink && (
                  <Button asChild variant="outline" className="w-full h-11">
                    <a href={mapsLink} target="_blank" rel="noreferrer">
                      <MapPin className="h-4 w-4 mr-2" /> Abrir en Maps
                    </a>
                  </Button>
                )}
              </Card>
            )}

            {wo.notas && (
              <Card className="p-4">
                <p className="text-sm font-semibold mb-1">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{wo.notas}</p>
              </Card>
            )}

            {canManage && (
              <Card className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Acciones {isAdmin ? 'de administrador' : 'de supervisor'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={() => navigate(`/work-orders/${wo.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Editar OT
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={() => setAssignOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {wo.tecnico_id ? 'Reasignar' : 'Asignar técnico'}
                  </Button>
                </div>
                {wo.tecnico && (
                  <p className="text-xs text-muted-foreground">
                    Técnico actual: {wo.tecnico.nombre} {wo.tecnico.apellido || ''}
                  </p>
                )}
              </Card>
            )}

            <Button onClick={goNext} className="w-full h-14 text-base">
              {isTecnico ? 'Iniciar trabajo' : 'Continuar'} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </>
        )}

        {step === 'checklist' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Checklist</h2>
              <span className="text-sm text-muted-foreground">
                {completados} de {checklistItems.length} completados
              </span>
            </div>
            {checklistItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Esta OT no tiene checklist.
              </p>
            ) : (
              <div className="space-y-2">
                {checklistItems.map((item: any) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-4 min-h-[44px] border rounded-lg bg-card active:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={item.completado}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="h-6 w-6 mt-0.5"
                    />
                    <span className={`flex-1 text-sm ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                      {item.texto}
                      {item.requerido && <span className="text-destructive ml-1">*</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'revision' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Revisión Pre-Servicio</h2>

            {/* Inspección Externa */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">Inspección Externa</h3>
              <p className="text-xs text-muted-foreground">
                Fotografía el estado del vehículo por fuera — rayones, abollones, daños preexistentes.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                id="foto-externa"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, 'externa')}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploadingSection === 'externa'}
                onClick={() => document.getElementById('foto-externa')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingSection === 'externa' ? 'Subiendo...' : 'Subir fotos externas'}
              </Button>

              {revisionData.externa.urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {revisionData.externa.urls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-full h-32 object-cover rounded border" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removePhoto('externa', url)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Observaciones externas (opcional)"
                value={revisionData.externa.comentario}
                rows={2}
                onChange={(e) =>
                  setRevisionData((prev) => ({
                    ...prev,
                    externa: { ...prev.externa, comentario: e.target.value },
                  }))
                }
                onBlur={(e) => saveRevisionComment('externa', e.target.value)}
              />
            </Card>

            {/* Inspección Interna */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">Inspección Interna</h3>
              <p className="text-xs text-muted-foreground">
                Fotografía el panel con el motor encendido — testigos activos, estado del interior.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                id="foto-interna"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, 'interna')}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploadingSection === 'interna'}
                onClick={() => document.getElementById('foto-interna')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingSection === 'interna' ? 'Subiendo...' : 'Subir fotos internas'}
              </Button>

              {revisionData.interna.urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {revisionData.interna.urls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-full h-32 object-cover rounded border" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removePhoto('interna', url)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Observaciones internas (opcional)"
                value={revisionData.interna.comentario}
                rows={2}
                onChange={(e) =>
                  setRevisionData((prev) => ({
                    ...prev,
                    interna: { ...prev.interna, comentario: e.target.value },
                  }))
                }
                onBlur={(e) => saveRevisionComment('interna', e.target.value)}
              />
            </Card>
          </div>
        )}

        {step === 'equipos' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Equipos a Instalar</h2>

            {(() => {
              const equiposAInstalar = (wo.items ?? []).filter(
                (i) => i.item_tipo === 'producto' && serializableIds.has(i.ref_id ?? '')
              );

              return equiposAInstalar.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  No hay equipos a instalar en esta OT
                </Card>
              ) : (
                <>
                  {equiposAInstalar.map((item) => {
                    const confirmed = confirmedSerials[item.id];
                    const matchingSerials = techSerials.filter((s) => s.product_id === item.ref_id);
                    const selectedSerial = serialSelections[item.id] || '';

                    return (
                      <Card key={item.id} className="p-4 space-y-3">
                        {(wo as any).tipo === 'garantia' && (
                          <Card className="p-4 border-orange-200 bg-orange-50 space-y-3">
                            <p className="text-sm font-medium text-orange-800">
                              OT de Garantía — Reemplazo de equipo
                            </p>
                            <div className="space-y-2">
                              <Label className="text-xs text-orange-700">
                                Serial del equipo defectuoso a retirar:
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Serial defectuoso..."
                                  value={serialDefectuoso[item.id] || ''}
                                  onChange={(e) =>
                                    setSerialDefectuoso((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value.toUpperCase(),
                                    }))
                                  }
                                  className="font-mono text-sm h-10"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="shrink-0 h-10"
                                  disabled={!serialDefectuoso[item.id]?.trim()}
                                  onClick={() => handleMarkDefectuoso(item.id, serialDefectuoso[item.id])}
                                >
                                  Marcar defectuoso
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                        <div>
                          <p className="font-medium text-sm">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">Cantidad: {item.cantidad}</p>
                        </div>

                        {confirmed ? (
                          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-green-700">Serial confirmado</p>
                              <p className="text-xs font-mono text-green-800">{confirmed}</p>
                            </div>
                          </div>
                        ) : matchingSerials.length === 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                              No tienes seriales disponibles para este producto en tu camioneta.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => toast.info('Comunícate con administración para solicitar el equipo.')}
                            >
                              Solicitar equipo a administración
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Select
                              value={selectedSerial || undefined}
                              onValueChange={(v) =>
                                setSerialSelections((prev) => ({ ...prev, [item.id]: v }))
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecciona el serial a instalar" />
                              </SelectTrigger>
                              <SelectContent>
                                {matchingSerials.map((s) => (
                                  <SelectItem key={s.id} value={s.serial_number}>
                                    {s.serial_number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              className="w-full h-11"
                              disabled={!selectedSerial || confirmingSerial === item.id}
                              onClick={() => handleConfirmSerial(item.id)}
                            >
                              {confirmingSerial === item.id ? 'Confirmando...' : 'Confirmar serial instalado'}
                            </Button>
                          </div>
                        )}

                        {/* Entrada manual de serial — siempre disponible si no está confirmado */}
                        {!confirmed && (
                          <div className="border-t pt-3 space-y-2">
                            <p className="text-xs text-muted-foreground">
                              ¿El serial no está en la lista o lo tienes en mano? Ingrésalo manualmente:
                            </p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Ej: ABC123456789"
                                value={manualSerials[item.id] || ''}
                                onChange={(e) =>
                                  setManualSerials((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value.toUpperCase(),
                                  }))
                                }
                                className="h-11 font-mono text-sm flex-1"
                              />
                              <Button
                                variant="outline"
                                className="shrink-0 h-11"
                                disabled={!manualSerials[item.id]?.trim() || confirmingSerial === item.id}
                                onClick={() => handleConfirmManualSerial(item.id, item.ref_id)}
                              >
                                {confirmingSerial === item.id ? '...' : 'Registrar'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {equiposAInstalar.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Confirma el serial de cada equipo antes de continuar.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {step === 'confirmacion' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Confirmación del Servicio</h2>

            {/* Resumen */}
            <Card className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumen</p>
              <p className="text-sm">
                <span className="text-muted-foreground">Cliente:</span> {wo.client?.razon_social || '—'}
              </p>
              {wo.vehicle && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Vehículo:</span> {wo.vehicle.patente} ·{' '}
                  {wo.vehicle.marca} {wo.vehicle.modelo}
                </p>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trabajos realizados:</p>
                {(wo.items ?? []).map((it) => (
                  <p key={it.id} className="text-sm">
                    • {it.nombre} × {it.cantidad}
                    {it.serial_instalado ? (
                      <span className="font-mono text-xs ml-2 text-muted-foreground">
                        [{it.serial_instalado}]
                      </span>
                    ) : null}
                  </p>
                ))}
              </div>
            </Card>

            {/* Fotos post-instalación */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Fotos Post-Instalación</h3>
              <p className="text-xs text-muted-foreground">
                Documenta el trabajo finalizado y el estado del vehículo al entregar.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                id="foto-confirmacion"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, 'confirmacion')}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploadingSection === 'confirmacion'}
                onClick={() => document.getElementById('foto-confirmacion')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingSection === 'confirmacion' ? 'Subiendo...' : 'Subir fotos finales'}
              </Button>

              {confirmacionData.urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {confirmacionData.urls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-full h-32 object-cover rounded border" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removePhoto('confirmacion', url)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                placeholder="Comentario sobre el trabajo realizado (opcional)"
                value={confirmacionData.comentario}
                rows={3}
                onChange={(e) =>
                  setConfirmacionData((prev) => ({ ...prev, comentario: e.target.value }))
                }
                onBlur={(e) => saveConfirmacionComment(e.target.value)}
              />
            </Card>
          </div>
        )}

        {step === 'firma' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Firma del cliente</h3>

              <div className="space-y-2">
                <Label>Nombre de quien recepciona</Label>
                <Input
                  placeholder="Nombre completo..."
                  value={firmaNombre}
                  onChange={(e) => setFirmaNombre(e.target.value)}
                  className="h-11 text-base"
                />
              </div>

              {firmaData ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Firma capturada:</p>
                  <img
                    src={firmaData}
                    alt="Firma"
                    className="border rounded-lg w-full max-h-48 object-contain bg-white"
                  />
                  <Button variant="outline" className="w-full" onClick={() => setFirmaData('')}>
                    Volver a firmar
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-14 text-base"
                  disabled={!firmaNombre.trim()}
                  onClick={() => setShowFirmaModal(true)}
                >
                  Ingresar Firma
                </Button>
              )}

              {!firmaNombre.trim() && !firmaData && (
                <p className="text-xs text-muted-foreground text-center">
                  Ingresa el nombre del receptor para habilitar la firma
                </p>
              )}
            </Card>

            <Button
              className="w-full h-14 text-base"
              disabled={!firmaData || !firmaNombre.trim()}
              onClick={() => setStep('cierre')}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 'cierre' && (
          <>
            {pendingGPS.length > 0 && (
              <Card className="p-4 border-orange-200 bg-orange-50 space-y-3">
                <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Configuración de GPS pendiente
                </p>
                {pendingGPS.map((si: any) => (
                  <div key={si.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-orange-700">{si.nombre}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-400 text-orange-700"
                      onClick={() => setSelectedSubscriptionItem(si)}
                    >
                      Configurar
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-orange-600">Configura el GPS antes de cerrar la OT</p>
              </Card>
            )}

            {subscriptionItems.length > 0 && pendingGPS.length === 0 && (
              <Card className="p-4 border-green-200 bg-green-50 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="gps-activo"
                    checked={gpsConfirmado}
                    onCheckedChange={(v) => setGpsConfirmado(!!v)}
                  />
                  <Label htmlFor="gps-activo" className="text-sm text-green-800 cursor-pointer">
                    Confirmo que el GPS quedó activo y funcionando correctamente
                  </Label>
                </div>
              </Card>
            )}

            <div>
              <Label htmlFor="obs">Observaciones finales</Label>
              <Textarea
                id="obs"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={6}
                className="mt-1 text-base"
                placeholder="Detalles del trabajo realizado..."
              />
            </div>
            <Button
              onClick={handleClose}
              disabled={
                closeWO.isPending ||
                !observaciones.trim() ||
                pendingGPS.length > 0 ||
                (subscriptionItems.length > 0 && !gpsConfirmado)
              }
              className="w-full h-14 text-base"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {closeWO.isPending ? 'Cerrando...' : 'Cerrar OT'}
            </Button>
          </>
        )}
      </div>

      {/* Sticky footer nav */}
      <div className="fixed bottom-16 left-0 right-0 z-[1050] bg-background border-t px-4 py-3 flex items-center gap-2">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="h-12"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <div className="flex-1 text-center text-xs text-muted-foreground">
          Paso {stepIdx + 1} de {STEPS.length} · {LABELS[step]}
        </div>
        {step !== 'cierre' && step !== 'info' && (
          <Button
            onClick={goNext}
            disabled={step === 'checklist' && !requiredDone}
            className="h-12"
          >
            Continuar <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {canManage && (
        <AssignTechnicianDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          workOrderId={wo.id}
          branchId={wo.branch_id}
        />
      )}

      {selectedSubscriptionItem && (
        <WOSubscriptionConfig
          open={!!selectedSubscriptionItem}
          onOpenChange={(open) => !open && setSelectedSubscriptionItem(null)}
          item={selectedSubscriptionItem}
          woId={wo.id}
        />
      )}

      {/* Modal de firma fullscreen */}
      <Dialog open={showFirmaModal} onOpenChange={setShowFirmaModal}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Firma aquí</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowFirmaModal(false)}>
              Cancelar
            </Button>
          </div>

          <div className="flex-1 relative bg-white">
            <SignaturePad
              ref={sigPadRef}
              canvasProps={{
                className: 'w-full h-full',
                style: { touchAction: 'none' },
              }}
              backgroundColor="white"
            />
          </div>

          <div className="flex gap-3 p-4 border-t">
            <Button
              variant="outline"
              className="flex-1 h-14 text-base"
              onClick={() => sigPadRef.current?.clear()}
            >
              Limpiar
            </Button>
            <Button
              className="flex-1 h-14 text-base"
              onClick={() => {
                if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
                  const dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
                  setFirmaData(dataUrl);
                  setShowFirmaModal(false);
                } else {
                  toast.error('Dibuja la firma antes de aceptar');
                }
              }}
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
