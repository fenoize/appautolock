import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useCreateSubscriptionFromWOItem, WOSubscriptionItem } from '@/hooks/useWOSubscriptionItems';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WOSubscriptionConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WOSubscriptionItem;
  woId: string;
  woFechaFin?: string;
}

interface GPSData {
  modelo_gps: string;
  imei_gps: string;
  imei_pcs: string;
  numero_pcs: string;
  compania: string;
  correo_usuario: string;
  app_alojada: string;
  instalador: string;
}

export function WOSubscriptionConfig({
  open,
  onOpenChange,
  item,
  woId,
  woFechaFin,
}: WOSubscriptionConfigProps) {
  const [planId, setPlanId] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState(woFechaFin || new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');
  const [imeiPrePoblado, setImeiPrePoblado] = useState(false);

  const [gpsData, setGpsData] = useState<GPSData>({
    modelo_gps: '',
    imei_gps: '',
    imei_pcs: '',
    numero_pcs: '',
    compania: '',
    correo_usuario: '',
    app_alojada: '',
    instalador: '',
  });

  const { data: allPlans } = useSubscriptionPlans();
  const createMutation = useCreateSubscriptionFromWOItem();

  // Auto-fill instalador con el usuario autenticado
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, apellido, email')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        const nombre =
          [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim() ||
          profile.email ||
          '';
        setGpsData((prev) => ({ ...prev, instalador: prev.instalador || nombre }));
      }
    };
    loadUser();
  }, []);

  // Buscar serial verificado del paso Equipos para pre-poblar IMEI GPS
  const { data: verifiedSerialItems } = useQuery({
    queryKey: ['wo-verified-serials', woId, item.ref_id],
    queryFn: async () => {
      if (!woId || !item.ref_id) return [];
      const { data, error } = await supabase
        .from('wo_items')
        .select('serial_instalado')
        .eq('wo_id', woId)
        .eq('ref_id', item.ref_id)
        .eq('serial_verificado', true)
        .not('serial_instalado', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!woId && !!item.ref_id,
  });

  useEffect(() => {
    if (verifiedSerialItems && verifiedSerialItems.length > 0 && !gpsData.imei_gps) {
      const firstSerial = verifiedSerialItems[0].serial_instalado;
      if (firstSerial) {
        setGpsData((prev) => ({ ...prev, imei_gps: firstSerial }));
        setImeiPrePoblado(true);
      }
    }
  }, [verifiedSerialItems]);

  const tiposDisponibles =
    item.product?.tipos_suscripcion_disponibles ||
    item.service?.tipos_suscripcion_disponibles ||
    [];

  const availablePlans =
    allPlans?.filter(
      (plan) => tiposDisponibles.length === 0 || tiposDisponibles.includes(plan.id)
    ) || [];

  const handleGpsDataChange = (field: keyof GPSData, value: string) => {
    setGpsData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!planId) return;

    const seriesjson = [
      gpsData.imei_gps ? { tipo: 'Equipo GPS', numero: gpsData.imei_gps } : null,
      gpsData.numero_pcs ? { tipo: 'Chip de Datos', numero: gpsData.numero_pcs } : null,
    ].filter(Boolean) as { tipo: string; numero: string }[];

    try {
      await createMutation.mutateAsync({
        woSubscriptionItemId: item.id,
        planId,
        numerosSerietext: seriesjson,
        fechaInicio,
        gpsData,
        woId,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error('Error al crear la suscripción. Revisa los datos.');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-[100dvh] max-w-none sm:max-w-lg sm:h-auto sm:max-h-[90vh] m-0 sm:m-auto p-0 rounded-none sm:rounded-lg flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-4 border-b shrink-0 text-left">
          <DialogTitle className="text-lg">Configurar Suscripción</DialogTitle>
          <DialogDescription className="text-sm">{item.nombre}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div className="space-y-1">
            <Label htmlFor="plan" className="text-sm font-medium">
              Plan de Suscripción *
            </Label>
            <Select value={planId || undefined} onValueChange={setPlanId}>
              <SelectTrigger id="plan" className="h-12">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nombre} - {plan.periodo_meses} meses - $
                    {plan.precio.toLocaleString('es-CL')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">Equipo GPS</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="modelo_gps" className="text-sm font-medium">
                  Modelo GPS
                </Label>
                <Input
                  id="modelo_gps"
                  className="h-12"
                  value={gpsData.modelo_gps}
                  onChange={(e) => handleGpsDataChange('modelo_gps', e.target.value)}
                  placeholder="Ej: GT06N, TK103B"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="imei_gps" className="text-sm font-medium">
                  IMEI GPS
                </Label>
                <Input
                  id="imei_gps"
                  className="h-12"
                  value={gpsData.imei_gps}
                  onChange={(e) => handleGpsDataChange('imei_gps', e.target.value)}
                  placeholder="Ej: 123456789012345"
                />
                {gpsData.imei_gps && imeiPrePoblado && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    Serial obtenido del paso Equipos
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="imei_pcs" className="text-sm font-medium">
                  IMEI PCS
                </Label>
                <Input
                  id="imei_pcs"
                  className="h-12"
                  value={gpsData.imei_pcs}
                  onChange={(e) => handleGpsDataChange('imei_pcs', e.target.value)}
                  placeholder="IMEI del PCS"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="numero_pcs" className="text-sm font-medium">
                  Número PCS / chip
                </Label>
                <Input
                  id="numero_pcs"
                  className="h-12"
                  value={gpsData.numero_pcs}
                  onChange={(e) => handleGpsDataChange('numero_pcs', e.target.value)}
                  placeholder="Número del chip"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="compania" className="text-sm font-medium">
                  Compañía / carrier
                </Label>
                <Input
                  id="compania"
                  className="h-12"
                  value={gpsData.compania}
                  onChange={(e) => handleGpsDataChange('compania', e.target.value)}
                  placeholder="Ej: Entel, Movistar"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">Acceso y Servicio</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="correo_usuario" className="text-sm font-medium">
                  Correo usuario
                </Label>
                <Input
                  id="correo_usuario"
                  type="email"
                  className="h-12"
                  value={gpsData.correo_usuario}
                  onChange={(e) => handleGpsDataChange('correo_usuario', e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="app_alojada" className="text-sm font-medium">
                  App alojada
                </Label>
                <Input
                  id="app_alojada"
                  className="h-12"
                  value={gpsData.app_alojada}
                  onChange={(e) => handleGpsDataChange('app_alojada', e.target.value)}
                  placeholder="Ej: GPS Tracker, Traccar"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="instalador" className="text-sm font-medium">
                  Instalador
                </Label>
                <Input
                  id="instalador"
                  className="h-12"
                  value={gpsData.instalador}
                  onChange={(e) => handleGpsDataChange('instalador', e.target.value)}
                  placeholder="Nombre del instalador"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="fecha" className="text-sm font-medium">
                  Fecha de inicio
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  className="h-12"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notas" className="text-sm font-medium">
                  Notas (opcional)
                </Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Agregar notas sobre la suscripción..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-t shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !planId}
            className="w-full h-14 text-base"
          >
            {createMutation.isPending ? 'Guardando...' : 'Crear Suscripción'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
