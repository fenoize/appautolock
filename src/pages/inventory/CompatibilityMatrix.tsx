import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import {
  CompatEstado,
  ProductCompatibility,
  VehicleCatalog,
  useCreateVehicleCatalog,
  useProductCompatibility,
  useUpsertCompatibility,
  useVehicleCatalog,
} from '@/hooks/useCompatibility';
import { CompatibilityBadge } from '@/components/compatibility/CompatibilityBadge';
import { usePermissions } from '@/hooks/usePermissions';

const COMBUSTIBLES = ['Bencina', 'Diesel', 'GLP', 'Eléctrico', 'Híbrido', 'Cualquiera'];
const ENCENDIDOS = ['Llave', 'Push-Start', 'Sin llave', 'Cualquiera'];

export default function CompatibilityMatrix() {
  const { isAdmin } = usePermissions();
  const { data: products } = useProducts();
  const gpsProducts = useMemo(
    () => (products ?? []).filter((p: any) => (p.tipos_suscripcion_disponibles?.length ?? 0) > 0),
    [products],
  );
  const [productId, setProductId] = useState<string>('');
  const [search, setSearch] = useState('');
  const { data: catalog = [] } = useVehicleCatalog(search);
  const { data: compats = [] } = useProductCompatibility(productId);
  const compatByCat = useMemo(() => {
    const map = new Map<string, ProductCompatibility>();
    compats.forEach((c) => map.set(c.vehicle_catalog_id, c));
    return map;
  }, [compats]);

  const upsert = useUpsertCompatibility();
  const createCatalog = useCreateVehicleCatalog();

  // Edit dialog state
  const [editing, setEditing] = useState<{ catalog: VehicleCatalog; current?: ProductCompatibility } | null>(
    null,
  );
  const [estado, setEstado] = useState<CompatEstado>('verde');
  const [obs, setObs] = useState('');

  // New catalog dialog state
  const [showNew, setShowNew] = useState(false);
  const [newRow, setNewRow] = useState<Partial<VehicleCatalog>>({
    marca: '',
    modelo: '',
    anio_desde: undefined,
    anio_hasta: undefined,
    tipo_combustible: 'Cualquiera',
    tipo_encendido: 'Cualquiera',
  });

  const openEdit = (cat: VehicleCatalog) => {
    const current = compatByCat.get(cat.id);
    setEditing({ catalog: cat, current });
    setEstado((current?.estado as CompatEstado) ?? 'verde');
    setObs(current?.observaciones ?? '');
  };

  const handleSave = async () => {
    if (!editing || !productId) return;
    await upsert.mutateAsync({
      product_id: productId,
      vehicle_catalog_id: editing.catalog.id,
      estado,
      observaciones: obs || null,
    });
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!newRow.marca || !newRow.modelo) return;
    await createCatalog.mutateAsync(newRow);
    setShowNew(false);
    setNewRow({
      marca: '',
      modelo: '',
      anio_desde: undefined,
      anio_hasta: undefined,
      tipo_combustible: 'Cualquiera',
      tipo_encendido: 'Cualquiera',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Compatibilidad de Productos"
        description="Define qué productos GPS son compatibles con cada modelo de vehículo del catálogo."
        action={
          isAdmin && (
            <Dialog open={showNew} onOpenChange={setShowNew}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar modelo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo modelo de catálogo</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Marca *</Label>
                    <Input
                      value={newRow.marca ?? ''}
                      onChange={(e) => setNewRow({ ...newRow, marca: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Modelo *</Label>
                    <Input
                      value={newRow.modelo ?? ''}
                      onChange={(e) => setNewRow({ ...newRow, modelo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Año desde</Label>
                    <Input
                      type="number"
                      value={newRow.anio_desde ?? ''}
                      onChange={(e) =>
                        setNewRow({ ...newRow, anio_desde: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Año hasta</Label>
                    <Input
                      type="number"
                      value={newRow.anio_hasta ?? ''}
                      onChange={(e) =>
                        setNewRow({ ...newRow, anio_hasta: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Combustible</Label>
                    <Select
                      value={newRow.tipo_combustible ?? 'Cualquiera'}
                      onValueChange={(v) => setNewRow({ ...newRow, tipo_combustible: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMBUSTIBLES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Encendido</Label>
                    <Select
                      value={newRow.tipo_encendido ?? 'Cualquiera'}
                      onValueChange={(v) => setNewRow({ ...newRow, tipo_encendido: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENCENDIDOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={!newRow.marca || !newRow.modelo}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Producto GPS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto…" />
              </SelectTrigger>
              <SelectContent>
                {gpsProducts.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
                {gpsProducts.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">No hay productos con suscripción GPS</div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Solo se listan productos con tipos de suscripción GPS configurados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Catálogo de vehículos</CardTitle>
              <div className="relative w-72 max-w-full">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por marca, modelo o año…"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Combustible</TableHead>
                    <TableHead>Encendido</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.map((c) => {
                    const cmp = compatByCat.get(c.id);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.marca}</TableCell>
                        <TableCell>{c.modelo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.anio_desde ?? '—'}–{c.anio_hasta ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm">{c.tipo_combustible ?? '—'}</TableCell>
                        <TableCell className="text-sm">{c.tipo_encendido ?? '—'}</TableCell>
                        <TableCell>
                          <CompatibilityBadge estado={cmp?.estado} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                          {cmp?.observaciones ?? '—'}
                        </TableCell>
                        <TableCell>
                          {isAdmin && productId && (
                            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {catalog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Sin modelos en el catálogo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {!productId && (
              <p className="text-sm text-muted-foreground mt-3">
                Selecciona un producto a la izquierda para gestionar su compatibilidad por modelo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Compatibilidad: {editing?.catalog.marca} {editing?.catalog.modelo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v as CompatEstado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verde">🟢 Compatible</SelectItem>
                  <SelectItem value="amarillo">🟡 Con observaciones</SelectItem>
                  <SelectItem value="rojo">🔴 No compatible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Observaciones</Label>
              <Textarea
                rows={4}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Ej: requiere arnés adicional, instalación especial, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
