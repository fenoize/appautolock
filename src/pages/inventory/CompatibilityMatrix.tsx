import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Search, ChevronRight, ChevronDown } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const COMBUSTIBLES = ['Bencina', 'Diesel', 'GLP', 'Eléctrico', 'Híbrido', 'Cualquiera'];
const ENCENDIDOS = ['Llave', 'Push-Start', 'Sin llave', 'Cualquiera'];

const versionLabel = (c: VehicleCatalog) => {
  if (c.anio_desde && c.anio_hasta) return `${c.anio_desde}–${c.anio_hasta}`;
  if (c.anio_desde) return `${c.anio_desde}+`;
  if (c.anio_hasta) return `Hasta ${c.anio_hasta}`;
  return 'Cualquier año';
};

const encendidoLabel = (v?: string | null) => {
  if (!v) return 'Cualquiera';
  if (v === 'Push-Start') return 'Botón';
  return v;
};

export default function CompatibilityMatrix() {
  const { isAdmin } = usePermissions();
  const { data: products } = useProducts();
  const allProducts = useMemo(() => products ?? [], [products]);
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

  const [editing, setEditing] = useState<{ catalog: VehicleCatalog; current?: ProductCompatibility } | null>(null);
  const [estado, setEstado] = useState<CompatEstado>('verde');
  const [obs, setObs] = useState('');

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

  // Build tree: marca -> modelo -> version -> combustible -> encendido (leaf)
  type Leaf = { key: string; label: string; catalog: VehicleCatalog };
  type Node = { key: string; label: string; children?: Node[]; leaves?: Leaf[] };

  const tree = useMemo<Node[]>(() => {
    const byMarca = new Map<string, Map<string, Map<string, Map<string, VehicleCatalog[]>>>>();
    for (const c of catalog) {
      const marca = c.marca || '—';
      const modelo = c.modelo || '—';
      const version = versionLabel(c);
      const comb = c.tipo_combustible || 'Cualquiera';
      if (!byMarca.has(marca)) byMarca.set(marca, new Map());
      const m1 = byMarca.get(marca)!;
      if (!m1.has(modelo)) m1.set(modelo, new Map());
      const m2 = m1.get(modelo)!;
      if (!m2.has(version)) m2.set(version, new Map());
      const m3 = m2.get(version)!;
      if (!m3.has(comb)) m3.set(comb, []);
      m3.get(comb)!.push(c);
    }
    const sortStr = (a: string, b: string) => a.localeCompare(b);
    return Array.from(byMarca.entries())
      .sort(([a], [b]) => sortStr(a, b))
      .map(([marca, m1]) => ({
        key: `marca:${marca}`,
        label: marca,
        children: Array.from(m1.entries())
          .sort(([a], [b]) => sortStr(a, b))
          .map(([modelo, m2]) => ({
            key: `marca:${marca}|modelo:${modelo}`,
            label: modelo,
            children: Array.from(m2.entries())
              .sort(([a], [b]) => sortStr(a, b))
              .map(([version, m3]) => ({
                key: `marca:${marca}|modelo:${modelo}|version:${version}`,
                label: version,
                children: Array.from(m3.entries())
                  .sort(([a], [b]) => sortStr(a, b))
                  .map(([comb, rows]) => ({
                    key: `marca:${marca}|modelo:${modelo}|version:${version}|comb:${comb}`,
                    label: comb,
                    leaves: rows.map((r) => ({
                      key: r.id,
                      label: encendidoLabel(r.tipo_encendido),
                      catalog: r,
                    })),
                  })),
              })),
          })),
      }));
  }, [catalog]);

  // Expanded state — marcas open by default
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      tree.forEach((n) => next.add(n.key));
      return next;
    });
  }, [tree]);

  // Auto-expand on search match
  useEffect(() => {
    if (!search.trim()) return;
    const s = search.toLowerCase();
    const next = new Set(expanded);
    const walk = (nodes: Node[], ancestors: string[]) => {
      for (const n of nodes) {
        const path = [...ancestors, n.key];
        const matchSelf = n.label.toLowerCase().includes(s);
        let matchLeaf = false;
        if (n.leaves) {
          matchLeaf = n.leaves.some((l) => l.label.toLowerCase().includes(s));
        }
        if (matchSelf || matchLeaf) path.forEach((k) => next.add(k));
        if (n.children) walk(n.children, path);
      }
    };
    walk(tree, []);
    setExpanded(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tree]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const indentClass = (depth: number) => ({ paddingLeft: `${depth * 20 + 12}px` });

  const renderNode = (node: Node, depth: number) => {
    const isOpen = expanded.has(node.key);
    const hasChildren = (node.children && node.children.length > 0) || (node.leaves && node.leaves.length > 0);
    return (
      <div key={node.key}>
        <button
          type="button"
          onClick={() => hasChildren && toggle(node.key)}
          className={cn(
            'w-full flex items-center gap-2 py-2 pr-3 text-left text-sm hover:bg-muted/60 transition-colors',
            depth === 0 && 'font-semibold text-foreground bg-muted/40',
            depth === 1 && 'font-medium',
          )}
          style={indentClass(depth)}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-4 w-4 text-primary shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <span className="w-4" />
          )}
          <span>{node.label}</span>
        </button>
        {isOpen && (
          <div>
            {node.children?.map((c) => renderNode(c, depth + 1))}
            {node.leaves?.map((leaf) => {
              const cmp = compatByCat.get(leaf.catalog.id);
              return (
                <div
                  key={leaf.key}
                  className="flex items-center gap-3 py-2 pr-3 border-l-2 border-primary/20 hover:bg-muted/40"
                  style={indentClass(depth + 1)}
                >
                  <span className="w-4" />
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-sm text-foreground">Encendido: {leaf.label}</span>
                  </div>
                  <CompatibilityBadge estado={cmp?.estado} />
                  <span className="flex-1 text-xs text-muted-foreground truncate">
                    {cmp?.observaciones ?? '—'}
                  </span>
                  {isAdmin && productId && (
                    <Button size="icon" variant="ghost" onClick={() => openEdit(leaf.catalog)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Compatibilidad de Productos"
        description="Define qué productos son compatibles con cada modelo de vehículo del catálogo."
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
            <CardTitle className="text-base">Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto…" />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
                {allProducts.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">No hay productos en el catálogo</div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define compatibilidad para cualquier producto del catálogo.
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
            <div className="border rounded-lg overflow-hidden bg-muted/20 divide-y">
              {tree.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Sin modelos en el catálogo
                </div>
              ) : (
                tree.map((n) => renderNode(n, 0))
              )}
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
