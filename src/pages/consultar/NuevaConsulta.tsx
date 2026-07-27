import { useState, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageContainer } from '@/components/shared/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Check,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  ArrowLeft,
  Search,
  Eye,
  ChevronDown,
  Download,
  Copy,
  AlertTriangle,
} from 'lucide-react';

type CompatEstado = 'compatible' | 'incompatible' | 'sin_datos';

type CompatResult = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  estado: CompatEstado;
  categoria: string | null;
  ficha_html: string | null;
  ficha_resumen: string | null;
};

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const STEPS = ['Vehículo', 'Lead', 'Compatibilidad'];

const COMBUSTIBLES = ['Bencina', 'Diesel', 'GLP', 'Eléctrico', 'Híbrido', 'Cualquiera'];
const ENCENDIDOS = ['Llave', 'Push-Start', 'Sin llave', 'Cualquiera'];
const PREFERENCIAS = ['WhatsApp', 'Llamada', 'Correo', 'Todos'];

function FichaModal({ servicio, onClose }: { servicio: CompatResult; onClose: () => void }) {
  const fichaRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fichaRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(fichaRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `ficha-${servicio.nombre.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{servicio.nombre}</DialogTitle>
        </DialogHeader>
        <div ref={fichaRef} className="rounded-lg bg-white dark:bg-gray-900 p-6 space-y-4">
          {servicio.ficha_html ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: servicio.ficha_html }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Este servicio no tiene ficha comercial configurada.
            </p>
          )}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Precio de venta</p>
            <p className="text-2xl font-bold text-primary">
              {clp.format(Number(servicio.precio_base))}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar JPG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function NuevaConsulta() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [lead, setLead] = useState({ nombre: '', telefono: '', email: '' });
  const [preferencias, setPreferencias] = useState<string[]>([]);
  const [vehiculo, setVehiculo] = useState({
    marca: '',
    modelo: '',
    anio: '',
    combustible: '',
    tipoEncendido: '',
  });
  const [marcaOptions, setMarcaOptions] = useState<string[]>([]);
  const [modeloOptions, setModeloOptions] = useState<string[]>([]);
  const [anioOptions, setAnioOptions] = useState<number[]>([]);
  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);
  const [showModeloDropdown, setShowModeloDropdown] = useState(false);
  const [showAnioDropdown, setShowAnioDropdown] = useState(false);
  const [compatResults, setCompatResults] = useState<CompatResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showIncompatibles, setShowIncompatibles] = useState(false);
  const [fichaServicio, setFichaServicio] = useState<CompatResult | null>(null);

  const fetchMarcas = async (value: string) => {
    const q = value.trim();
    const { data } = await supabase
      .from('vehicle_catalog')
      .select('marca')
      .ilike('marca', q ? `%${q}%` : '%')
      .order('marca')
      .limit(100);
    const unique = [...new Set((data ?? []).map((r: any) => r.marca))] as string[];
    setMarcaOptions(unique);
    setShowMarcaDropdown(unique.length > 0);
  };

  const handleMarcaChange = async (value: string) => {
    setVehiculo(prev => ({ ...prev, marca: value, modelo: '', anio: '' }));
    setShowModeloDropdown(false);
    setShowAnioDropdown(false);
    await fetchMarcas(value);
  };

  const selectMarca = (value: string) => {
    setVehiculo(prev => ({ ...prev, marca: value, modelo: '', anio: '' }));
    setMarcaOptions([]);
    setShowMarcaDropdown(false);
  };

  const fetchModelos = async (value: string) => {
    if (!vehiculo.marca) return;
    const q = value.trim();
    const { data } = await supabase
      .from('vehicle_catalog')
      .select('modelo')
      .eq('marca', vehiculo.marca)
      .ilike('modelo', q ? `%${q}%` : '%')
      .order('modelo')
      .limit(50);
    const unique = [...new Set((data ?? []).map((r: any) => r.modelo))] as string[];
    setModeloOptions(unique);
    setShowModeloDropdown(unique.length > 0);
  };

  const handleModeloChange = async (value: string) => {
    setVehiculo(prev => ({ ...prev, modelo: value, anio: '' }));
    setShowAnioDropdown(false);
    await fetchModelos(value);
  };

  const selectModelo = (value: string) => {
    setVehiculo(prev => ({ ...prev, modelo: value, anio: '' }));
    setModeloOptions([]);
    setShowModeloDropdown(false);
  };

  const fetchAnios = async (value: string) => {
    if (!vehiculo.marca || !vehiculo.modelo) return;
    const q = value.trim();
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
    const filteredYears = [...years]
      .filter(y => (q ? String(y).startsWith(q) : true))
      .sort((a, b) => b - a);
    setAnioOptions(filteredYears);
    setShowAnioDropdown(filteredYears.length > 0);
  };

  const handleAnioChange = async (value: string) => {
    setVehiculo(prev => ({ ...prev, anio: value }));
    await fetchAnios(value);
  };


  const selectAnio = (value: number) => {
    setVehiculo(prev => ({ ...prev, anio: String(value) }));
    setAnioOptions([]);
    setShowAnioDropdown(false);
  };

  const loadCompatibility = async () => {
    setLoadingResults(true);
    const anio = parseInt(vehiculo.anio);
    const { data: compatData, error } = await supabase
      .from('services')
      .select(
        `id, nombre, descripcion, precio_base, categoria, ficha_html, ficha_resumen,
         services_products(
           product_id,
           products(
             id, nombre,
             product_compatibility(
               estado,
               vehicle_catalog(marca, modelo, anio_desde, anio_hasta, tipo_combustible, tipo_encendido)
             )
           )
         )`
      )
      .eq('activo', true);

    if (error) {
      toast({
        title: 'Error al consultar compatibilidad',
        description: error.message,
        variant: 'destructive',
      });
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
        categoria: service.categoria ?? null,
        ficha_html: service.ficha_html ?? null,
        ficha_resumen: service.ficha_resumen ?? null,
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
            (pc.vehicle_catalog.anio_hasta ?? 9999) >= anio &&
            (!vehiculo.combustible ||
              vehiculo.combustible === 'Cualquiera' ||
              pc.vehicle_catalog.tipo_combustible === vehiculo.combustible ||
              pc.vehicle_catalog.tipo_combustible === 'Cualquiera') &&
            (!vehiculo.tipoEncendido ||
              vehiculo.tipoEncendido === 'Cualquiera' ||
              pc.vehicle_catalog.tipo_encendido === vehiculo.tipoEncendido ||
              pc.vehicle_catalog.tipo_encendido === 'Cualquiera')
        );
        if (!match) hasIncompatible = true;
        else if (match.estado === 'verde') hasCompatible = true;
        else hasIncompatible = true;
      }

      if (hasCompatible && !hasIncompatible)
        return { ...base, estado: 'compatible' as CompatEstado };
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
    setStep(3);
    await loadCompatibility();
  };

  const resetWizard = () => {
    setStep(1);
    setLead({ nombre: '', telefono: '', email: '' });
    setPreferencias([]);
    setVehiculo({ marca: '', modelo: '', anio: '', combustible: '', tipoEncendido: '' });
    setCompatResults([]);
    setSelectedServices(new Set());
    setSearchQuery('');
    setFilterCategoria('');
    setShowIncompatibles(false);
    setFichaServicio(null);
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
          preferencia_contacto: preferencias.filter(p => p !== 'Todos'),
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
          notas: `Vehículo: ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`,
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

  const categorias = [
    ...new Set(compatResults.map(r => r.categoria).filter(Boolean)),
  ] as string[];

  const filtered = compatResults.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      r.nombre.toLowerCase().includes(q) ||
      (r.descripcion ?? '').toLowerCase().includes(q);
    const matchCat = !filterCategoria || r.categoria === filterCategoria;
    return matchSearch && matchCat;
  });
  const visibles = filtered.filter(r => r.estado !== 'incompatible');
  const incompatibles = filtered.filter(r => r.estado === 'incompatible');

  const renderServiceCard = (svc: CompatResult) => (
    <Card key={svc.id} className={cn(svc.estado === 'incompatible' && 'opacity-70')}>
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
            <div className="flex items-center gap-2">
              {estadoBadge(svc.estado)}
              {svc.ficha_html && (
                <Button variant="outline" size="sm" onClick={() => setFichaServicio(svc)}>
                  <Eye className="h-4 w-4 mr-1" /> Ver ficha
                </Button>
              )}
            </div>
          </div>
          {svc.categoria && (
            <Badge variant="outline" className="mt-1">
              {svc.categoria}
            </Badge>
          )}
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
  );

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

      {/* Step 1 - Vehículo */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-medium">Vehículo del cliente</h2>

            <div className="space-y-2">
              <Label>Marca *</Label>
              <div className="relative">
                <Input
                  value={vehiculo.marca}
                  onChange={e => handleMarcaChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && marcaOptions.length > 0) {
                      e.preventDefault();
                      selectMarca(marcaOptions[0]);
                    }
                  }}
                  placeholder="Buscar marca..."
                  onBlur={() => setTimeout(() => setShowMarcaDropdown(false), 150)}
                  onFocus={() => fetchMarcas(vehiculo.marca)}
                  autoComplete="off"
                />
                {showMarcaDropdown && (
                  <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-52 overflow-y-auto">
                    {marcaOptions.map(opt => (
                      <li
                        key={opt}
                        onMouseDown={() => selectMarca(opt)}
                        className="px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Modelo *</Label>
              <div className="relative">
                <Input
                  value={vehiculo.modelo}
                  onChange={e => handleModeloChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && modeloOptions.length > 0) {
                      e.preventDefault();
                      selectModelo(modeloOptions[0]);
                    }
                  }}
                  placeholder="Buscar modelo..."
                  onBlur={() => setTimeout(() => setShowModeloDropdown(false), 150)}
                  onFocus={() => fetchModelos(vehiculo.modelo)}
                  autoComplete="off"
                />
                {showModeloDropdown && (
                  <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-52 overflow-y-auto">
                    {modeloOptions.map(opt => (
                      <li
                        key={opt}
                        onMouseDown={() => selectModelo(opt)}
                        className="px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Año *</Label>
                <div className="relative">
                  <Input
                    value={vehiculo.anio}
                    onChange={e => handleAnioChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && anioOptions.length > 0) {
                        e.preventDefault();
                        selectAnio(anioOptions[0]);
                      }
                    }}
                    placeholder="Buscar año..."
                    onBlur={() => setTimeout(() => setShowAnioDropdown(false), 150)}
                    onFocus={() => fetchAnios(vehiculo.anio)}
                    autoComplete="off"
                  />
                  {showAnioDropdown && (
                    <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-52 overflow-y-auto">
                      {anioOptions.map(opt => (
                        <li
                          key={opt}
                          onMouseDown={() => selectAnio(opt)}
                          className="px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Combustible <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Select
                  value={vehiculo.combustible || 'Cualquiera'}
                  onValueChange={v => setVehiculo(prev => ({ ...prev, combustible: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Cualquiera —" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMBUSTIBLES.map(c => (
                      <SelectItem key={c} value={c}>
                        {c === 'Cualquiera' ? '— Cualquiera —' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Tipo de Encendido{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Select
                  value={vehiculo.tipoEncendido || 'Cualquiera'}
                  onValueChange={v => setVehiculo(prev => ({ ...prev, tipoEncendido: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Cualquiera —" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENCENDIDOS.map(c => (
                      <SelectItem key={c} value={c}>
                        {c === 'Cualquiera' ? '— Cualquiera —' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                disabled={!vehiculo.marca || !vehiculo.modelo || !vehiculo.anio}
                onClick={() => setStep(2)}
              >
                Continuar →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 - Lead */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-medium">Datos del Lead</h2>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={lead.nombre}
                onChange={e => {
                  const v = e.target.value;
                  setLead({ ...lead, nombre: v.charAt(0).toUpperCase() + v.slice(1) });
                }}
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

            <div className="space-y-2">
              <div>
                <Label>Preferencia de contacto</Label>
                <p className="text-xs text-muted-foreground">Opcional</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {PREFERENCIAS.map(opcion => (
                  <label key={opcion} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={preferencias.includes(opcion)}
                      onCheckedChange={checked => {
                        if (opcion === 'Todos') {
                          setPreferencias(checked ? ['WhatsApp', 'Llamada', 'Correo', 'Todos'] : []);
                        } else {
                          const indiv = ['WhatsApp', 'Llamada', 'Correo'];
                          const next = checked
                            ? [...preferencias.filter(p => p !== 'Todos'), opcion]
                            : preferencias.filter(p => p !== opcion && p !== 'Todos');
                          const allChecked = indiv.every(p => next.includes(p));
                          setPreferencias(allChecked ? [...next, 'Todos'] : next);
                        }
                      }}
                    />
                    <span className="text-sm">{opcion}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Volver
              </Button>
              <Button disabled={!lead.nombre.trim()} onClick={goToResults}>
                Ver compatibilidad →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 - Compatibilidad */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Consulta para{' '}
            <span className="font-medium text-foreground">{lead.nombre || 'Lead'}</span> ·{' '}
            {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
            {vehiculo.combustible && vehiculo.combustible !== 'Cualquiera'
              ? ` · ${vehiculo.combustible}`
              : ''}
            {vehiculo.tipoEncendido && vehiculo.tipoEncendido !== 'Cualquiera'
              ? ` · ${vehiculo.tipoEncendido}`
              : ''}
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
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar servicio..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {categorias.length > 0 && (
                  <Select
                    value={filterCategoria || 'all'}
                    onValueChange={v => setFilterCategoria(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categorias.map(c => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-3">
                {visibles.map(svc => renderServiceCard(svc))}

                {visibles.length === 0 && incompatibles.length === 0 && (
                  <Card>
                    <CardContent className="p-10 text-center text-muted-foreground">
                      No hay servicios que coincidan con el filtro.
                    </CardContent>
                  </Card>
                )}

                {incompatibles.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowIncompatibles(prev => !prev)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          showIncompatibles && 'rotate-180'
                        )}
                      />
                      {showIncompatibles
                        ? 'Ocultar'
                        : `Ver ${incompatibles.length} no compatible${incompatibles.length > 1 ? 's' : ''}`}
                    </button>
                    {showIncompatibles && (
                      <div className="mt-2 space-y-3">
                        {incompatibles.map(svc => renderServiceCard(svc))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
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

      {fichaServicio && (
        <FichaModal servicio={fichaServicio} onClose={() => setFichaServicio(null)} />
      )}
    </PageContainer>
  );
}
