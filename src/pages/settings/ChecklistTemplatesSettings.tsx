import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useChecklistTemplates,
  useCreateChecklistTemplate,
  useUpdateChecklistTemplate,
  useDeleteChecklistTemplate,
  useCreateTemplateItem,
  useUpdateTemplateItem,
  useDeleteTemplateItem,
  ChecklistTemplateWithItems,
} from '@/hooks/useChecklistTemplates';

export default function ChecklistTemplatesSettings() {
  const { data: templates = [], isLoading } = useChecklistTemplates();
  const createTpl = useCreateChecklistTemplate();
  const updateTpl = useUpdateChecklistTemplate();
  const deleteTpl = useDeleteChecklistTemplate();
  const createItem = useCreateTemplateItem();
  const updateItem = useUpdateTemplateItem();
  const deleteItem = useDeleteTemplateItem();

  const [openNew, setOpenNew] = useState(false);
  const [newTpl, setNewTpl] = useState({ nombre: '', descripcion: '' });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [editTplValues, setEditTplValues] = useState({ nombre: '', descripcion: '' });
  const [newItemByTpl, setNewItemByTpl] = useState<Record<string, { titulo: string; obligatorio: boolean }>>({});

  const handleCreate = async () => {
    if (!newTpl.nombre.trim()) return;
    await createTpl.mutateAsync({ nombre: newTpl.nombre, descripcion: newTpl.descripcion, items: [] });
    setNewTpl({ nombre: '', descripcion: '' });
    setOpenNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plantillas de Checklist</h1>
          <p className="text-muted-foreground">Crea plantillas reutilizables para aplicar en servicios.</p>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva plantilla
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay plantillas creadas todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const items = [...(tpl.checklist_template_items || [])].sort((a, b) => a.orden - b.orden);
            const isOpen = expanded[tpl.id] ?? false;
            const ni = newItemByTpl[tpl.id] || { titulo: '', obligatorio: true };
            return (
              <Card key={tpl.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1">
                    <button
                      className="flex items-center gap-2 text-left"
                      onClick={() => setExpanded((p) => ({ ...p, [tpl.id]: !isOpen }))}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <CardTitle className="text-lg">{tpl.nombre}</CardTitle>
                      <Badge variant="secondary">{items.length} ítems</Badge>
                      {!tpl.activa && <Badge variant="outline">Inactiva</Badge>}
                    </button>
                    {tpl.descripcion && <p className="text-sm text-muted-foreground mt-1 ml-6">{tpl.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tpl.activa}
                        onCheckedChange={(v) => updateTpl.mutate({ id: tpl.id, activa: v })}
                      />
                      <Label className="text-xs">Activa</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setEditingTplId(tpl.id); setEditTplValues({ nombre: tpl.nombre, descripcion: tpl.descripcion || '' }); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { if (confirm('¿Eliminar plantilla?')) deleteTpl.mutate(tpl.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="space-y-3">
                    {items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3 p-2 border rounded">
                        <Input
                          className="w-16"
                          type="number"
                          value={it.orden}
                          onChange={(e) => updateItem.mutate({ id: it.id, orden: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                          className="flex-1"
                          value={it.titulo}
                          onChange={(e) => updateItem.mutate({ id: it.id, titulo: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={it.obligatorio}
                            onCheckedChange={(v) => updateItem.mutate({ id: it.id, obligatorio: v })}
                          />
                          <Label className="text-xs">Obligatorio</Label>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteItem.mutate(it.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 p-2 border rounded bg-muted/30">
                      <Input
                        placeholder="Nuevo ítem del checklist"
                        value={ni.titulo}
                        onChange={(e) => setNewItemByTpl((p) => ({ ...p, [tpl.id]: { ...ni, titulo: e.target.value } }))}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ni.obligatorio}
                          onCheckedChange={(v) => setNewItemByTpl((p) => ({ ...p, [tpl.id]: { ...ni, obligatorio: v } }))}
                        />
                        <Label className="text-xs">Obligatorio</Label>
                      </div>
                      <Button
                        size="sm"
                        disabled={!ni.titulo.trim()}
                        onClick={async () => {
                          await createItem.mutateAsync({
                            template_id: tpl.id,
                            titulo: ni.titulo.trim(),
                            obligatorio: ni.obligatorio,
                            orden: items.length + 1,
                          });
                          setNewItemByTpl((p) => ({ ...p, [tpl.id]: { titulo: '', obligatorio: true } }));
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Agregar
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva plantilla de checklist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={newTpl.nombre} onChange={(e) => setNewTpl({ ...newTpl, nombre: e.target.value })} placeholder="Ej: Instalación GPS estándar" />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={newTpl.descripcion} onChange={(e) => setNewTpl({ ...newTpl, descripcion: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newTpl.nombre.trim() || createTpl.isPending}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTplId} onOpenChange={(o) => !o && setEditingTplId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar plantilla</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={editTplValues.nombre} onChange={(e) => setEditTplValues({ ...editTplValues, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={editTplValues.descripcion} onChange={(e) => setEditTplValues({ ...editTplValues, descripcion: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTplId(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!editingTplId) return;
                await updateTpl.mutateAsync({ id: editingTplId, nombre: editTplValues.nombre, descripcion: editTplValues.descripcion });
                setEditingTplId(null);
              }}
            >Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
