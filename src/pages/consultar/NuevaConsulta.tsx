import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/components/shared/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Megaphone,
  Globe,
  Instagram,
  MessageCircle,
  Mail,
  User,
  Check,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

type CompatEstado = 'compatible' | 'incompatible' | 'sin_datos';

type CompatResult = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  estado: CompatEstado;
};

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const CANALES = [
  { label: 'Meta Ads', icon: Megaphone },
  { label: 'Google Ads', icon: Globe },
  { label: 'Instagram', icon: Instagram },
  { label: 'WhatsApp', icon: MessageCircle },
  { label: 'Email', icon: Mail },
  { label: 'Directo', icon: User },
];

const STEPS = ['Canal', 'Lead', 'Vehículo', 'Resultados'];

export default function NuevaConsulta() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [canal, setCanal] = useState<string>('');
  const [lead, setLead] = useState({ nombre: '', telefono: '', email: '' });
  const [vehiculo, setVehiculo] = useState({ marca: '', modelo: '', anio: '' });
  const [marcaOptions, setMarcaOptions] = useState<string[]>([]);
  const [modeloOptions, setModeloOptions] = useState<string[]>([]);
  const [anioOptions, setAnioOptions] = useState<number[]>([]);
  const [compatResults, setCompatResults] = useState<CompatResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [creatingQuote, setCreatingQuote] = useState(false);

  // Marcas
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('vehicle_catalog').select('marca').order('marca');
      setMarcaOptions([...new Set((data ?? []).map((r: any) => r.marca))]);
    })();
  }, []);

  // Modelos
  useEffect(() => {
    if (!vehiculo.marca) {
      setModeloOptions([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('vehicle_catalog')
        .select('modelo')
        .eq('marca', vehiculo.marca)
        .order('modelo');
      setModeloOptions([...new Set((data ?? []).map((r: any) => r.modelo))]);
    })();
  }, [vehiculo.marca]);

  // Años
  useEffect(() => {
    if (!vehiculo.marca || !vehiculo.modelo) {
      setAnioOptions([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('vehicle_catalog')
        .select('anio_desde, anio_hasta')
        .eq('marca', vehiculo.marca)
        .eq('modelo', vehiculo.modelo);
      const years = new Set<number>();
      const currentYear = new Date().getFullYear() + 1;
      (data ?? []).forEach((r: any) => {
        const desde = r.anio_desde ?? 1990;
        const hasta = r.anio_hasta ?? currentYear;
        for (let y = desde; y <= hasta; y++) years.add(y);
      });
      setAnioOptions([...years].sort((a, b) => b - a));
    })();
  }, [vehiculo.marca, vehiculo.modelo]);

  const loadCompatibility = async () => {
    setLoadingResults(true);
    const anio = parseInt(vehiculo.anio);
    const { data: compatData, error } = await supabase
      .from('services')
      .select(
        `id, nombre, descripcion, precio_base,
         services_products(
           product_id,
           products(
             id, nombre,
             product_compatibility(
               estado,
               vehicle_catalog(marca, modelo, anio_desde, anio_hasta)
             )
           )
         )`
      )
      .eq('activo', true);

    if (error) {
      toast({ title: 'Error al consultar compatibilidad', description: error.message, variant: 'destructive' });
      setLoadingResults(false);
      return;
    }

    const results: CompatResult[] = (compatData ?? []).map((service: any) => {
      const allProducts = service.services_products ?? [];
      const base = {
        id: service.id,
        nombre: service.nombre,
        descripcion: service.descripcion ?? '',
        precio_base: service.precio_base,
      };

      if (allProducts.length === 0) return { ...base, estado: 'sin_datos' as CompatEstado };

      let hasCompatible = false;
      let hasIncompatible = false;

      for (const sp of allProducts) {
        const compat = sp.products?.product_compatibility ?? [];
        const match = compat.find(
          (pc: any) =>
            pc.vehicle_catalog &&
            pc.vehicle_catalog.marca?.toLowerCase() === vehiculo.marca.toLowerCase() &&
            pc.vehicle_catalog.modelo?.toLowerCase() === vehiculo.modelo.toLowerCase() &&
            (pc.vehicle_catalog.anio_desde ?? 0) <= anio &&
            (pc.vehicle_catalog.anio_hasta ?? 9999) >= anio
        );
        if (!match) hasIncompatible = true;
        else if (match.estado === 'verde') hasCompatible = true;
        else hasIncompatible = true;
      }

      if (hasCompatible && !hasIncompatible) return { ...base, estado: 'compatible' as CompatEstado };
      if (hasIncompatible) return { ...base, estado: 'incompatible' as CompatEstado };
      return { ...base, estado: 'sin_datos' as CompatEstado };
    });

    const order: Record<CompatEstado, number> = { compatible: 0, sin_datos: 1, incompatible: 2 };
    results.sort((a, b) => order[a.estado] - order[b.estado]);

    setCompatResults(results);
    setSelectedServices(new Set(results.filter(r => r.estado === 'compatible').map(r => r.id)));
    setLoadingResults(false);
  };

  const goToResults = async () => {
    setStep(4);
    await loadCompatibility();
  };

  const resetWizard = () => {
    setStep(1);
    setCanal('');
    setLead({ nombre: '', telefono: '', email: '' });
    setVehiculo({ marca: '', modelo: '', anio: '' });
    setCompatResults([]);
    setSelectedServices(new Set());
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateQuote = async () => {
    setCreatingQuote(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Sesión no válida');

      const { data: profile } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('id', userId)
        .maybeSingle();

      let branchId = profile?.branch_id ?? null;
      if (!branchId) {
        const { data: branch } = await supabase
          .from('branches')
          .select('id')
          .eq('activa', true)
          .limit(1)
          .maybeSingle();
        branchId = branch?.id ?? null;
      }
      if (!branchId) throw new Error('No hay sucursal disponible para crear la cotización');

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          tipo: 'persona' as const,
          nombre_comercial: lead.nombre,
          email_principal: lead.email || null,
          telefonos: lead.telefono ? [lead.telefono] : [],
          estado: 'prospecto' as const,
          pasaporte: 'PENDIENTE',
          notas: `Canal: ${canal}`,
          branch_id: branchId,
        })
        .select()
        .single();
      if (clientError) throw clientError;

      const selectedItems = compatResults.filter(r => selectedServices.has(r.id));
      const neto = selectedItems.reduce((sum, s) => sum + Number(s.precio_base), 0);
      const iva = Math.round(neto * 0.19);
      const total = neto + iva;

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          client_id: client.id,
          vendedor_id: userId,
          branch_id: branchId,
          neto,
          iva,
          total,
          estado: 'borrador' as const,
          notas: `Vehículo: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} | Canal: ${canal}`,
          folio: `CON-${Date.now()}`,
        })
        .select()
        .single();
      if (quoteError) throw quoteError;

      for (const svc of selectedItems) {
        await supabase.from('quote_items').insert({
          quote_id: quote.id,
          item_tipo: 'servicio',
          ref_id: svc.id,
          nombre: svc.nombre,
          descripcion: svc.descripcion,
          cantidad: 1,
          precio_unitario: Number(svc.precio_base),
          subtotal: Number(svc.precio_base),
        });
      }

      toast({ title: 'Cotización creada', description: `Folio ${quote.folio}` });
      navigate(`/quotes/${quote.id}`);
    } catch (e: any) {
      toast({ title: 'Error al crear cotización', description: e.message, variant: 'destructive' });
    } finally {
      setCreatingQuote(false);
    }
  };

  const estadoBadge = (estado: CompatEstado) => {
    if (estado === 'compatible')
      return (
        <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900">
          <CheckCircle className="h-3.5 w-3.5" /> Compatible
        </Badge>
      );
    if (estado === 'incompatible')
      return (
        <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
          <XCircle className="h-3.5 w-3.5" /> No compatible
        </Badge>
      );
    return (
      <Badge variant="secondary" className="gap-1">
        <HelpCircle className="h-3.5 w-3.5" /> Sin datos
      </Badge>
    );
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Consulta</h1>
        <p className="text-sm text-muted-foreground">
          Consulta rápida de compatibilidad y servicios
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  current && 'border-primary bg-primary/10 text-primary font-medium',
                  done && 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400',
                  !current && !done && 'border-border text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                    current && 'bg-primary text-primary-foreground',
                    done && 'bg-green-500 text-white',
                    !current && !done && 'bg-muted'
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : n}
                </span>
                {label}
              </div>
              {n < STEPS.length && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-medium">Canal de origen</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {CANALES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setCanal(label);
                    setStep(2);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border p-6 transition-colors hover:bg-accent',
                    canal === label
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary'
                      : 'border-border bg-card'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-medium">Datos del Lead</h2>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={lead.nombre}
                onChange={e => setLead({ ...lead, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={lead.telefono}
                onChange={e => setLead({ ...lead, telefono: e.target.value })}
                placeholder="+56 9..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={lead.email}
                onChange={e => setLead({ ...lead, email: e.target.value })}
                placeholder="correo@email.com"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Volver
              </Button>
              <Button disabled={!lead.nombre.trim()} onClick={() => setStep(3)}>
                Continuar →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-medium">Vehículo del cliente</h2>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                value={vehiculo.marca}
                onValueChange={v => setVehiculo({ marca: v, modelo: '', anio: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcaOptions.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                value={vehiculo.modelo}
                disabled={!vehiculo.marca}
                onValueChange={v => setVehiculo(prev => ({ ...prev, modelo: v, anio: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modeloOptions.map(m => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Select
                value={vehiculo.anio}
                disabled={!vehiculo.modelo}
                onValueChange={v => setVehiculo(prev => ({ ...prev, anio: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un año" />
                </SelectTrigger>
                <SelectContent>
                  {anioOptions.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Volver
              </Button>
              <Button
                disabled={!vehiculo.marca || !vehiculo.modelo || !vehiculo.anio}
                onClick={goToResults}
              >
                Ver compatibilidad →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Consulta para <span className="font-medium text-foreground">{lead.nombre}</span> ·{' '}
            {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio} · Canal: {canal}
          </p>

          {loadingResults ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Buscando servicios compatibles...
            </div>
          ) : compatResults.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                No se encontraron servicios activos.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {compatResults.map(svc => (
                <Card
                  key={svc.id}
                  className={cn(svc.estado === 'incompatible' && 'opacity-70')}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <Checkbox
                      className="mt-1"
                      checked={selectedServices.has(svc.id)}
                      disabled={svc.estado === 'incompatible'}
                      onCheckedChange={() => toggleService(svc.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{svc.nombre}</span>
                        {estadoBadge(svc.estado)}
                      </div>
                      {svc.descripcion && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{svc.descripcion}</p>
                      )}
                      <p className="mt-1 text-sm">
                        Precio de venta:{' '}
                        <span className="font-semibold">{clp.format(Number(svc.precio_base))}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <Button variant="ghost" onClick={resetWizard}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Nueva consulta
            </Button>
            <Button
              disabled={selectedServices.size === 0 || creatingQuote}
              onClick={handleCreateQuote}
            >
              {creatingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cotización →
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
