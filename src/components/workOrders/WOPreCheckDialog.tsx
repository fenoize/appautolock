import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PreCheckItem {
  id: string;
  texto: string;
  requerido: boolean;
  completado: boolean;
}

const DEFAULT_ITEMS: PreCheckItem[] = [
  { id: '1', texto: 'Dispositivo GPS disponible (verificar modelo e IMEI)', requerido: true, completado: false },
  { id: '2', texto: 'Chip de datos con saldo activo', requerido: true, completado: false },
  { id: '3', texto: 'Cable de alimentación y fusible', requerido: true, completado: false },
  { id: '4', texto: 'Herramientas de instalación (alicates, destornillador, cinta aislante)', requerido: true, completado: false },
  { id: '5', texto: 'Multímetro / probador de corriente', requerido: false, completado: false },
  { id: '6', texto: 'Celular o tablet con app de configuración', requerido: true, completado: false },
  { id: '7', texto: 'Credenciales de plataforma GPS verificadas', requerido: true, completado: false },
];

interface WOPreCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  woId: string;
  onConfirm: () => void;
}

export default function WOPreCheckDialog({ open, onOpenChange, woId, onConfirm }: WOPreCheckDialogProps) {
  const [items, setItems] = useState<PreCheckItem[]>(DEFAULT_ITEMS);
  const [saving, setSaving] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completado: !item.completado } : item)),
    );
  };

  const requiredItems = items.filter((i) => i.requerido);
  const requiredCompleted = requiredItems.filter((i) => i.completado).length;
  const allRequiredDone = requiredCompleted === requiredItems.length;

  const handleConfirm = async () => {
    if (!allRequiredDone) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          pre_check_completado: true,
          pre_check_data: {
            items,
            completado_at: new Date().toISOString(),
          } as any,
        })
        .eq('id', woId);

      if (error) throw error;
      onConfirm();
    } catch (err: any) {
      toast.error(`Error al guardar pre-check: ${err.message ?? err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pre-check de herramientas y dispositivos</DialogTitle>
          <DialogDescription>
            Marca todos los ítems requeridos antes de iniciar la ruta. Esta verificación quedará registrada en la OT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {requiredCompleted} / {requiredItems.length} requeridos completados
          </p>
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card cursor-pointer active:bg-muted/50"
            >
              <Checkbox
                checked={item.completado}
                onCheckedChange={() => toggleItem(item.id)}
                className="h-5 w-5 mt-0.5"
              />
              <span className={`flex-1 text-sm ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                {item.texto}
                {item.requerido && <span className="text-destructive ml-1">*</span>}
              </span>
            </label>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!allRequiredDone || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar y continuar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
