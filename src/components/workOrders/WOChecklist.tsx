import { useState } from 'react';
import { ChecklistData, ChecklistItem } from '@/types/workOrders';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WOChecklistProps {
  checklist: ChecklistData;
  onChange: (checklist: ChecklistData) => void;
  readonly?: boolean;
}

export const WOChecklist = ({ checklist, onChange, readonly = false }: WOChecklistProps) => {
  const handleItemChange = (itemId: string, field: keyof ChecklistItem, value: any) => {
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    onChange({ ...checklist, items: updatedItems });
  };

  const completedCount = checklist.items.filter(item => item.completado).length;
  const totalCount = checklist.items.length;
  const requiredCount = checklist.items.filter(item => item.requerido).length;
  const completedRequiredCount = checklist.items.filter(item => item.requerido && item.completado).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Checklist de Servicio</span>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {totalCount} completados
          </span>
        </CardTitle>
        {requiredCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Obligatorios: {completedRequiredCount} / {requiredCount}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {checklist.items.map((item) => (
          <div key={item.id} className="space-y-2 p-3 border rounded">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={item.completado}
                onCheckedChange={(checked) => 
                  handleItemChange(item.id, 'completado', checked as boolean)
                }
                disabled={readonly}
              />
              <div className="flex-1">
                <Label className="flex items-center gap-2">
                  {item.texto}
                  {item.requerido && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  value={item.notas || ''}
                  onChange={(e) => handleItemChange(item.id, 'notas', e.target.value)}
                  placeholder="Notas adicionales (opcional)"
                  className="mt-2"
                  disabled={readonly}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
