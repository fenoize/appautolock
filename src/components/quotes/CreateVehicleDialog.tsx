import { useEffect, useState } from 'react';
import { useCreateVehicle } from '@/hooks/useVehicles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { CatalogVehiclePicker } from '@/components/vehicles/CatalogVehiclePicker';
import { FUEL_TYPES, IGNITION_TYPES } from '@/types/vehicles';
import { toast } from 'sonner';

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onVehicleCreated: (vehicleId: string) => void;
}

const emptyForm = (clientId: string) => ({
  client_id: clientId,
  marca: '',
  modelo: '',
  patente: '',
  anio: new Date().getFullYear(),
  combustible: '',
  tipo_encendido: 'Desconocido' as (typeof IGNITION_TYPES)[number],
  color: '',
});

export function CreateVehicleDialog({
  open,
  onOpenChange,
  clientId,
  onVehicleCreated,
}: CreateVehicleDialogProps) {
  const createVehicle = useCreateVehicle();
  const [formData, setFormData] = useState(emptyForm(clientId));

  useEffect(() => {
    if (open) setFormData(emptyForm(clientId));
  }, [open, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || clientId.trim() === '') {
      toast.error('No se puede crear vehículo sin un cliente válido');
      return;
    }
    if (!formData.marca || !formData.modelo) {
      toast.error('Selecciona marca y modelo desde el catálogo');
      return;
    }
    if (!formData.patente) {
      toast.error('La patente es obligatoria');
      return;
    }

    try {
      const vehicle = await createVehicle.mutateAsync({
        ...formData,
        client_id: clientId,
        patente: formData.patente.toUpperCase(),
      } as any);
      onVehicleCreated(vehicle.id);
      onOpenChange(false);
      toast.success('Vehículo creado exitosamente');
    } catch (error) {
      console.error('Error al crear vehículo:', error);
      toast.error('Error al crear el vehículo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Vehículo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CatalogVehiclePicker
            value={{
              marca: formData.marca,
              modelo: formData.modelo,
              anio: formData.anio,
              combustible: formData.combustible,
              tipo_encendido: formData.tipo_encendido,
            }}
            onChange={(v) =>
              setFormData({
                ...formData,
                marca: v.marca,
                modelo: v.modelo,
                anio: v.anio ?? formData.anio,
                combustible: v.combustible ?? formData.combustible,
                tipo_encendido:
                  (IGNITION_TYPES as readonly string[]).includes(v.tipo_encendido ?? '')
                    ? (v.tipo_encendido as (typeof IGNITION_TYPES)[number])
                    : formData.tipo_encendido,
              })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Patente *</Label>
              <Input
                value={formData.patente}
                onChange={(e) =>
                  setFormData({ ...formData, patente: e.target.value.toUpperCase() })
                }
                placeholder="ABCD12"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Blanco"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Combustible</Label>
              <Select
                value={formData.combustible || undefined}
                onValueChange={(value) => setFormData({ ...formData, combustible: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de encendido</Label>
              <Select
                value={formData.tipo_encendido}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_encendido: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IGNITION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createVehicle.isPending}>
              {createVehicle.isPending ? 'Creando...' : 'Crear Vehículo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
