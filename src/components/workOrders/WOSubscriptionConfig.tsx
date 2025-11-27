import { useState } from 'react';
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
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface WOSubscriptionConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WOSubscriptionItem;
  woFechaFin?: string;
}

export function WOSubscriptionConfig({
  open,
  onOpenChange,
  item,
  woFechaFin,
}: WOSubscriptionConfigProps) {
  const [planId, setPlanId] = useState<string>('');
  const [numerosSerietext, setNumerosSerietext] = useState<{ tipo: string; numero: string }[]>([
    { tipo: 'Equipo GPS', numero: '' },
    { tipo: 'Chip de Datos', numero: '' },
  ]);
  const [fechaInicio, setFechaInicio] = useState(woFechaFin || new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');

  const { data: allPlans } = useSubscriptionPlans();
  const createMutation = useCreateSubscriptionFromWOItem();

  // Obtener planes disponibles según el producto/servicio
  const tiposDisponibles = item.product?.tipos_suscripcion_disponibles || 
                           item.service?.tipos_suscripcion_disponibles || 
                           [];
  
  const availablePlans = allPlans?.filter(plan => 
    tiposDisponibles.length === 0 || tiposDisponibles.includes(plan.id)
  ) || [];

  const handleAddSerial = () => {
    setNumerosSerietext([...numerosSerietext, { tipo: 'Otro', numero: '' }]);
  };

  const handleRemoveSerial = (index: number) => {
    setNumerosSerietext(numerosSerietext.filter((_, i) => i !== index));
  };

  const handleSerialChange = (index: number, field: 'tipo' | 'numero', value: string) => {
    const updated = [...numerosSerietext];
    updated[index][field] = value;
    setNumerosSerietext(updated);
  };

  const handleSubmit = async () => {
    if (!planId) {
      return;
    }

    const seriesjson = numerosSerietext
      .filter(s => s.numero.trim())
      .map(s => ({ tipo: s.tipo, numero: s.numero }));

    await createMutation.mutateAsync({
      woSubscriptionItemId: item.id,
      planId,
      numerosSerietext: seriesjson,
      fechaInicio,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Suscripción</DialogTitle>
          <DialogDescription>
            Configura los detalles de la suscripción para: <strong>{item.nombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selección de Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plan de Suscripción *</Label>
            <Select value={planId || undefined} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nombre} - {plan.periodo_meses} meses - ${plan.precio.toLocaleString('es-CL')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Números de Serie */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Números de Serie *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSerial}>
                + Agregar
              </Button>
            </div>
            
            <div className="space-y-3">
              {numerosSerietext.map((serial, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`tipo-${index}`}>Tipo</Label>
                      <Input
                        id={`tipo-${index}`}
                        value={serial.tipo}
                        onChange={(e) => handleSerialChange(index, 'tipo', e.target.value)}
                        placeholder="Ej: Equipo GPS"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`numero-${index}`}>Número</Label>
                      <Input
                        id={`numero-${index}`}
                        value={serial.numero}
                        onChange={(e) => handleSerialChange(index, 'numero', e.target.value)}
                        placeholder="Ingresa el número de serie"
                      />
                    </div>
                    {numerosSerietext.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-8"
                        onClick={() => handleRemoveSerial(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Fecha de Inicio */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de Inicio</Label>
            <Input
              id="fecha"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Por defecto: fecha de finalización de la OT
            </p>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agregar notas sobre la suscripción..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !planId || numerosSerietext.every(s => !s.numero.trim())}
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Suscripción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
