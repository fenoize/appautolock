import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChecklistTemplates, useApplyTemplateToService } from '@/hooks/useChecklistTemplates';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  serviceId: string;
}

export function ApplyChecklistTemplateDialog({ open, onOpenChange, serviceId }: Props) {
  const { data: templates = [] } = useChecklistTemplates();
  const apply = useApplyTemplateToService();
  const [templateId, setTemplateId] = useState<string>('');
  const [mode, setMode] = useState<'replace' | 'append'>('append');

  const activeTemplates = templates.filter((t) => t.activa);
  const selected = activeTemplates.find((t) => t.id === templateId);

  const handleApply = async () => {
    if (!templateId) return;
    await apply.mutateAsync({ serviceId, templateId, mode });
    onOpenChange(false);
    setTemplateId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Aplicar plantilla de checklist</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Selecciona una plantilla" /></SelectTrigger>
              <SelectContent>
                {activeTemplates.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">No hay plantillas activas</div>
                ) : activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre} ({t.checklist_template_items?.length || 0} ítems)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected?.descripcion && <p className="text-xs text-muted-foreground">{selected.descripcion}</p>}
          </div>

          <div className="space-y-2">
            <Label>Modo de aplicación</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'replace' | 'append')}>
              <div className="flex items-start space-x-2 border rounded p-3">
                <RadioGroupItem value="append" id="append" className="mt-1" />
                <div>
                  <Label htmlFor="append" className="font-medium cursor-pointer">Agregar al final</Label>
                  <p className="text-xs text-muted-foreground">Mantiene los ítems actuales y añade los de la plantilla.</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 border rounded p-3">
                <RadioGroupItem value="replace" id="replace" className="mt-1" />
                <div>
                  <Label htmlFor="replace" className="font-medium cursor-pointer">Reemplazar todo</Label>
                  <p className="text-xs text-muted-foreground">Elimina los ítems actuales y los reemplaza por los de la plantilla.</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleApply} disabled={!templateId || apply.isPending}>
            {apply.isPending ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
