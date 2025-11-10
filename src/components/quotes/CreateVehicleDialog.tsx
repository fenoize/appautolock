import { useState } from 'react';
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
import { toast } from 'sonner';

interface CreateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onVehicleCreated: (vehicleId: string) => void;
}

export function CreateVehicleDialog({ 
  open, 
  onOpenChange, 
  clientId,
  onVehicleCreated 
}: CreateVehicleDialogProps) {
  const createVehicle = useCreateVehicle();
  const [formData, setFormData] = useState({
    client_id: clientId,
    marca: '',
    modelo: '',
    patente: '',
    anio: new Date().getFullYear(),
    combustible: '',
    color: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que clientId no esté vacío
    if (!clientId || clientId.trim() === '') {
      toast.error('No se puede crear vehículo sin un cliente válido');
      return;
    }
    
    try {
      const vehicleData = {
        ...formData,
        client_id: clientId,
      };
      
      const vehicle = await createVehicle.mutateAsync(vehicleData as any);
      onVehicleCreated(vehicle.id);
      onOpenChange(false);
      setFormData({
        client_id: clientId,
        marca: '',
        modelo: '',
        patente: '',
        anio: new Date().getFullYear(),
        combustible: '',
        color: '',
      });
      toast.success('Vehículo creado exitosamente');
    } catch (error) {
      console.error('Error al crear vehículo:', error);
      toast.error('Error al crear el vehículo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Vehículo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca *</Label>
              <Input
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Toyota"
                required
              />
            </div>
            <div>
              <Label>Modelo *</Label>
              <Input
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Corolla"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Patente *</Label>
              <Input
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                placeholder="ABCD12"
                required
              />
            </div>
            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Combustible</Label>
              <Input
                value={formData.combustible}
                onChange={(e) => setFormData({ ...formData, combustible: e.target.value })}
                placeholder="Gasolina"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Blanco"
              />
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
