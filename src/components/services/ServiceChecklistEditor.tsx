import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { ServiceChecklistItem } from "@/types/services";
import { useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from "@/hooks/useServices";

interface ServiceChecklistEditorProps {
  serviceId: string;
  items: ServiceChecklistItem[];
}

export function ServiceChecklistEditor({ serviceId, items }: ServiceChecklistEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    titulo: "",
    obligatorio: true,
    orden: items.length + 1
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ titulo: string; obligatorio: boolean; orden: number }>({ 
    titulo: "", 
    obligatorio: true,
    orden: 0
  });

  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const handleAdd = async () => {
    if (!newItem.titulo.trim()) return;
    
    await createItem.mutateAsync({
      service_id: serviceId,
      titulo: newItem.titulo,
      obligatorio: newItem.obligatorio,
      orden: newItem.orden
    });
    
    setIsAdding(false);
    setNewItem({ titulo: "", obligatorio: true, orden: items.length + 2 });
  };

  const handleEdit = (item: ServiceChecklistItem) => {
    setEditingId(item.id);
    setEditValues({
      titulo: item.titulo,
      obligatorio: item.obligatorio,
      orden: item.orden
    });
  };

  const handleSaveEdit = async (id: string) => {
    await updateItem.mutateAsync({
      id,
      serviceId,
      titulo: editValues.titulo,
      obligatorio: editValues.obligatorio,
      orden: editValues.orden
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este ítem?")) {
      await deleteItem.mutateAsync({ id, serviceId });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Items del Checklist</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ítem
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={newItem.titulo}
                onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
                placeholder="Ej: Verificar nivel de aceite"
              />
            </div>
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                min="1"
                value={newItem.orden}
                onChange={(e) => setNewItem({ ...newItem, orden: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newItem.obligatorio}
                onCheckedChange={(checked) => setNewItem({ ...newItem, obligatorio: checked })}
              />
              <Label>Obligatorio</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newItem.titulo.trim()}>
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
                {editingId === item.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={editValues.titulo}
                        onChange={(e) => setEditValues({ ...editValues, titulo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Orden</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editValues.orden}
                        onChange={(e) => setEditValues({ ...editValues, orden: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editValues.obligatorio}
                        onCheckedChange={(checked) => setEditValues({ ...editValues, obligatorio: checked })}
                      />
                      <Label>Obligatorio</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(item.id)}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm text-muted-foreground w-8">{item.orden}.</span>
                    <p className="flex-1">{item.titulo}</p>
                    {item.obligatorio && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                        Obligatorio
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No hay items en el checklist</p>
        )}
      </CardContent>
    </Card>
  );
}
