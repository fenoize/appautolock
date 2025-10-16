import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { Vehicle } from '@/types/vehicles';
import { Car, Plus } from 'lucide-react';
import { CreateVehicleDialog } from './CreateVehicleDialog';
import { Badge } from '@/components/ui/badge';

interface AssignVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSelectVehicle: (vehicleId: string) => void;
}

export function AssignVehicleDialog({ 
  open, 
  onOpenChange, 
  clientId,
  onSelectVehicle 
}: AssignVehicleDialogProps) {
  const { data: vehicles = [], isLoading } = useVehiclesByClient(clientId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleSelectVehicle = (vehicleId: string) => {
    onSelectVehicle(vehicleId);
    onOpenChange(false);
  };

  const handleVehicleCreated = (vehicleId: string) => {
    setShowCreateDialog(false);
    handleSelectVehicle(vehicleId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar Vehículo</DialogTitle>
            <DialogDescription>
              Selecciona un vehículo existente o crea uno nuevo para esta cotización
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botón para crear nuevo vehículo */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Nuevo Vehículo
            </Button>

            {/* Lista de vehículos existentes */}
            <div className="border rounded-lg divide-y">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Cargando vehículos...
                </div>
              ) : vehicles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No hay vehículos registrados para este cliente
                </div>
              ) : (
                vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleSelectVehicle(vehicle.id)}
                    className="w-full p-4 hover:bg-accent/50 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {vehicle.marca} {vehicle.modelo}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{vehicle.patente}</span>
                          {vehicle.anio && (
                            <Badge variant="outline" className="text-xs">
                              {vehicle.anio}
                            </Badge>
                          )}
                          {vehicle.combustible && (
                            <Badge variant="outline" className="text-xs">
                              {vehicle.combustible}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Seleccionar →
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateVehicleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        clientId={clientId}
        onVehicleCreated={handleVehicleCreated}
      />
    </>
  );
}