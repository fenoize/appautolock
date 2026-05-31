import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateVehicleCatalog, type VehicleCatalog } from '@/hooks/useCompatibility';
import { toast } from 'sonner';

const COMBUSTIBLES = ['Bencina', 'Diesel', 'GLP', 'Eléctrico', 'Híbrido', 'Cualquiera'];
const ENCENDIDOS = ['Llave', 'Push-Start', 'Sin llave', 'Cualquiera'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMarca?: string;
  initialModelo?: string;
  onCreated?: (entry: VehicleCatalog) => void;
}

export function AddCatalogEntryDialog({
  open,
  onOpenChange,
  initialMarca = '',
  initialModelo = '',
  onCreated,
}: Props) {
  const createCatalog = useCreateVehicleCatalog();
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    marca: initialMarca,
    modelo: initialModelo,
    anio_desde: '' as string,
    anio_hasta: '' as string,
    tipo_combustible: '',
    tipo_encendido: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        marca: initialMarca,
        modelo: initialModelo,
        anio_desde: '',
        anio_hasta: '',
        tipo_combustible: '',
        tipo_encendido: '',
      });
    }
  }, [open, initialMarca, initialModelo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.marca.trim() || !form.modelo.trim()) {
      toast.error('Marca y modelo son obligatorios');
      return;
    }
    if (!form.tipo_combustible || !form.tipo_encendido) {
      toast.error('Debes indicar tipo de combustible y encendido');
      return;
    }
    const desde = form.anio_desde ? parseInt(form.anio_desde, 10) : null;
    const hasta = form.anio_hasta ? parseInt(form.anio_hasta, 10) : null;
    if (!desde || !hasta) {
      toast.error('Debes indicar año desde y año hasta');
      return;
    }
    if (desde > hasta) {
      toast.error('"Año desde" no puede ser mayor que "Año hasta"');
      return;
    }

    try {
      const entry = await createCatalog.mutateAsync({
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio_desde: desde,
        anio_hasta: hasta,
        tipo_combustible: form.tipo_combustible,
        tipo_encendido: form.tipo_encendido,
      });
      onCreated?.(entry as VehicleCatalog);
      onOpenChange(false);
    } catch {
      // toast handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar modelo al catálogo</DialogTitle>
          <DialogDescription>
            Este modelo quedará disponible para todos los vehículos y para la matriz de compatibilidad.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marca *</Label>
              <Input
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="Toyota"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Input
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Corolla"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Año desde *</Label>
              <Input
                type="number"
                min="1900"
                max={currentYear + 1}
                value={form.anio_desde}
                onChange={(e) => setForm({ ...form, anio_desde: e.target.value })}
                placeholder="2010"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Año hasta *</Label>
              <Input
                type="number"
                min="1900"
                max={currentYear + 1}
                value={form.anio_hasta}
                onChange={(e) => setForm({ ...form, anio_hasta: e.target.value })}
                placeholder={String(currentYear)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Combustible *</Label>
              <Select
                value={form.tipo_combustible || undefined}
                onValueChange={(v) => setForm({ ...form, tipo_combustible: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {COMBUSTIBLES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de encendido *</Label>
              <Select
                value={form.tipo_encendido || undefined}
                onValueChange={(v) => setForm({ ...form, tipo_encendido: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {ENCENDIDOS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCatalog.isPending}>
              {createCatalog.isPending ? 'Guardando...' : 'Agregar al catálogo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
