import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { ServiceProduct } from "@/types/services";
import { useCreateServiceProduct, useUpdateServiceProduct, useDeleteServiceProduct } from "@/hooks/useServices";
import { useProducts } from "@/hooks/useProducts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceMaterialsEditorProps {
  serviceId: string;
  materials: ServiceProduct[];
}

export function ServiceMaterialsEditor({ serviceId, materials }: ServiceMaterialsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    product_id: "",
    cantidad: 1,
    es_sustituible: false
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ cantidad: number; es_sustituible: boolean }>({ cantidad: 1, es_sustituible: false });

  const { data: products } = useProducts();
  const createMaterial = useCreateServiceProduct();
  const updateMaterial = useUpdateServiceProduct();
  const deleteMaterial = useDeleteServiceProduct();

  const handleAdd = async () => {
    if (!newMaterial.product_id) return;
    
    await createMaterial.mutateAsync({
      service_id: serviceId,
      product_id: newMaterial.product_id,
      cantidad: newMaterial.cantidad,
      es_sustituible: newMaterial.es_sustituible
    });
    
    setIsAdding(false);
    setNewMaterial({ product_id: "", cantidad: 1, es_sustituible: false });
  };

  const handleEdit = (material: ServiceProduct) => {
    setEditingId(material.id);
    setEditValues({
      cantidad: material.cantidad,
      es_sustituible: material.es_sustituible
    });
  };

  const handleSaveEdit = async (id: string) => {
    await updateMaterial.mutateAsync({
      id,
      serviceId,
      cantidad: editValues.cantidad,
      es_sustituible: editValues.es_sustituible
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este material?")) {
      await deleteMaterial.mutateAsync({ id, serviceId });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Materiales Requeridos</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Material
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={newMaterial.product_id || undefined} onValueChange={(value) => setNewMaterial({ ...newMaterial, product_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nombre} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={newMaterial.cantidad}
                onChange={(e) => setNewMaterial({ ...newMaterial, cantidad: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newMaterial.es_sustituible}
                onCheckedChange={(checked) => setNewMaterial({ ...newMaterial, es_sustituible: checked })}
              />
              <Label>Sustituible</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newMaterial.product_id}>
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {materials && materials.length > 0 ? (
          <div className="space-y-2">
            {materials.map((material) => (
              <div key={material.id} className="flex justify-between items-center p-3 border rounded">
                {editingId === material.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editValues.cantidad}
                        onChange={(e) => setEditValues({ ...editValues, cantidad: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editValues.es_sustituible}
                        onCheckedChange={(checked) => setEditValues({ ...editValues, es_sustituible: checked })}
                      />
                      <Label>Sustituible</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(material.id)}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{material.product?.nombre}</p>
                      <p className="text-sm text-muted-foreground">SKU: {material.product?.sku}</p>
                      <p className="text-sm">
                        Cantidad: {material.cantidad}
                        {material.es_sustituible && <span className="ml-2 text-xs text-muted-foreground">(Sustituible)</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(material.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No hay materiales asignados</p>
        )}
      </CardContent>
    </Card>
  );
}
