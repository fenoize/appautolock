import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTechniciansByBranch } from '@/hooks/useTechnicians';
import { useAssignTechnician } from '@/hooks/useAssignTechnician';
import { Loader2, User, Wrench } from 'lucide-react';

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  branchId: string;
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  workOrderId,
  branchId,
}: AssignTechnicianDialogProps) {
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const { data: technicians, isLoading } = useTechniciansByBranch(branchId);
  const assignTechnician = useAssignTechnician();

  const handleAssign = async () => {
    if (!selectedTechnicianId) return;

    await assignTechnician.mutateAsync({
      woId: workOrderId,
      technicianId: selectedTechnicianId,
    });

    onOpenChange(false);
  };

  const getAvailabilityBadge = (status: 'disponible' | 'ocupado' | 'muy_ocupado') => {
    const variants = {
      disponible: { variant: 'default' as const, label: 'Disponible', color: 'bg-green-500' },
      ocupado: { variant: 'secondary' as const, label: 'Ocupado', color: 'bg-yellow-500' },
      muy_ocupado: { variant: 'destructive' as const, label: 'Muy Ocupado', color: 'bg-red-500' },
    };

    const config = variants[status];
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Asignar Técnico
          </DialogTitle>
          <DialogDescription>
            Selecciona un técnico disponible de la sucursal para asignar esta orden de trabajo.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !technicians || technicians.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay técnicos disponibles en esta sucursal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
              <div className="space-y-2">
                {technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className={`flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedTechnicianId === tech.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTechnicianId(tech.id)}
                  >
                    <RadioGroupItem value={tech.id} id={tech.id} />
                    <Label
                      htmlFor={tech.id}
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {tech.nombre} {tech.apellido}
                          </p>
                          <p className="text-sm text-muted-foreground">{tech.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {getAvailabilityBadge(tech.availability_status)}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {tech.active_work_orders} OTs activas
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tech.in_progress_count} en proceso
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTechnicianId || assignTechnician.isPending}
              >
                {assignTechnician.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Asignar Técnico
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
