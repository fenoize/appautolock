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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const COMBUSTIBLES = ['Bencina', 'Diesel', 'GLP', 'Eléctrico', 'Híbrido', 'Cualquiera'];
const ENCENDIDOS = ['Llave', 'Push-Start', 'Sin llave', 'Cualquiera'];

const encendidoLabel = (v?: string | null) => {
  if (!v) return 'Cualquiera';
  if (v === 'Push-Start') return 'Botón';
  return v;
};

type NodeStatus = CompatEstado | 'sin_datos' | 'mixto';

const STATUS_LABEL: Record<NodeStatus, string> = {
  verde: 'Compatible',
  amarillo: 'Con observaciones',
  rojo: 'No compatible',
  sin_datos: 'Sin datos',
  mixto: 'Mixto',
};

const StatusPill = ({ status }: { status: NodeStatus }) => {
  const cls =
    status === 'verde'
      ? 'bg-green-500/15 text-green-700 border-green-500/30'
      : status === 'rojo'
      ? 'bg-red-500/15 text-red-700 border-red-500/30'
      : status === 'amarillo'
      ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30'
      : status === 'mixto'
      ? 'bg-orange-500/15 text-orange-700 border-orange-500/30'
      : 'bg-muted text-muted-foreground border-border';
  const Icon =
    status === 'verde' ? Check : status === 'rojo' ? X : status === 'mixto' ? CircleDot : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {STATUS_LABEL[status]}
    </span>
  );
};

export default function CompatibilityMatrix() {
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
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

  // Bulk cascade update: assign an estado to a set of catalog ids for the current product
  const cascadeUpdate = async (catalogIds: string[], nextEstado: CompatEstado) => {
    if (!productId || catalogIds.length === 0) return;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    const rows = catalogIds.map((vid) => {
      const existing = compatByCat.get(vid);
      return {
        product_id: productId,
        vehicle_catalog_id: vid,
        estado: nextEstado,
        observaciones: existing?.observaciones ?? null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await (supabase as any)
      .from('product_compatibility')
      .upsert(rows, { onConflict: 'product_id,vehicle_catalog_id' });
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['product_compatibility'] });
    queryClient.invalidateQueries({ queryKey: ['compatibility_for_vehicle'] });
    toast.success(`Actualizados ${catalogIds.length} registro(s)`);
  };

  // Build tree: marca -> modelo -> año (individual) -> combustible -> encendido (leaf)
  type Leaf = { key: string; label: string; catalog: VehicleCatalog };
  type Node = {
    key: string;
    label: string;
    leafIds: string[]; // all catalog ids under this node (for cascade + aggregated status)
    children?: Node[];
    leaves?: Leaf[];
  };

  const tree = useMemo<Node[]>(() => {
    // marca -> modelo -> year(string) -> combustible -> VehicleCatalog[]
    const byMarca = new Map<string, Map<string, Map<string, Map<string, VehicleCatalog[]>>>>();
    const MAX_YEAR_SPAN = 60; // safety cap

    const addRow = (yearKey: string, c: VehicleCatalog) => {
      const marca = c.marca || '—';
      const modelo = c.modelo || '—';
      const comb = c.tipo_combustible || 'Cualquiera';
      if (!byMarca.has(marca)) byMarca.set(marca, new Map());
      const m1 = byMarca.get(marca)!;
      if (!m1.has(modelo)) m1.set(modelo, new Map());
      const m2 = m1.get(modelo)!;
      if (!m2.has(yearKey)) m2.set(yearKey, new Map());
      const m3 = m2.get(yearKey)!;
      if (!m3.has(comb)) m3.set(comb, []);
      m3.get(comb)!.push(c);
    };

    for (const c of catalog) {
      const desde = c.anio_desde ?? null;
      const hasta = c.anio_hasta ?? null;
      if (desde && hasta && hasta >= desde) {
        const span = Math.min(hasta - desde + 1, MAX_YEAR_SPAN);
        for (let i = 0; i < span; i++) addRow(String(desde + i), c);
      } else if (desde && !hasta) {
        addRow(String(desde), c);
      } else if (!desde && hasta) {
        addRow(String(hasta), c);
      } else {
        addRow('Cualquier año', c);
      }
    }

    const sortStr = (a: string, b: string) => a.localeCompare(b);
    const sortYear = (a: string, b: string) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na; // newer first
      return sortStr(a, b);
    };

    return Array.from(byMarca.entries())
      .sort(([a], [b]) => sortStr(a, b))
      .map(([marca, m1]) => {
        const modelos: Node[] = Array.from(m1.entries())
          .sort(([a], [b]) => sortStr(a, b))
          .map(([modelo, m2]) => {
            const years: Node[] = Array.from(m2.entries())
              .sort(([a], [b]) => sortYear(a, b))
              .map(([year, m3]) => {
                const combs: Node[] = Array.from(m3.entries())
                  .sort(([a], [b]) => sortStr(a, b))
                  .map(([comb, rows]) => {
                    const leaves: Leaf[] = rows.map((r) => ({
                      key: `${year}|${comb}|${r.id}`,
                      label: encendidoLabel(r.tipo_encendido),
                      catalog: r,
                    }));
                    const leafIds = rows.map((r) => r.id);
                    return {
                      key: `marca:${marca}|modelo:${modelo}|year:${year}|comb:${comb}`,
                      label: comb,
                      leafIds,
                      leaves,
                    };
                  });
                const leafIds = combs.flatMap((n) => n.leafIds);
                return {
                  key: `marca:${marca}|modelo:${modelo}|year:${year}`,
                  label: year,
                  leafIds,
                  children: combs,
                };
              });
            const leafIds = years.flatMap((n) => n.leafIds);
            return {
              key: `marca:${marca}|modelo:${modelo}`,
              label: modelo,
              leafIds,
              children: years,
            };
          });
        const leafIds = modelos.flatMap((n) => n.leafIds);
        return {
          key: `marca:${marca}`,
          label: marca,
          leafIds,
          children: modelos,
        };
      });
  }, [catalog]);

  // Aggregated status for any node from its descendant catalog ids
  const nodeStatus = (leafIds: string[]): NodeStatus => {
    if (leafIds.length === 0) return 'sin_datos';
    const states = new Set<CompatEstado | 'sin_datos'>();
    for (const id of leafIds) {
      const c = compatByCat.get(id);
      states.add(c ? (c.estado as CompatEstado) : 'sin_datos');
      if (states.size > 1) return 'mixto';
    }
    const only = Array.from(states)[0];
    return only as NodeStatus;
  };

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

  // Clickable status pill with popover for cascade assignment
  const StatusControl = ({
    leafIds,
    disabled,
  }: {
    leafIds: string[];
    disabled?: boolean;
  }) => {
    const status = nodeStatus(leafIds);
    const [open, setOpen] = useState(false);
    if (disabled) return <StatusPill status={status} />;
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-80 transition-opacity"
          >
            <StatusPill status={status} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1" align="end" onClick={(e) => e.stopPropagation()}>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
            onClick={async () => {
              setOpen(false);
              await cascadeUpdate(leafIds, 'verde');
            }}
          >
            <Check className="h-4 w-4 text-green-600" /> Compatible
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
            onClick={async () => {
              setOpen(false);
              await cascadeUpdate(leafIds, 'amarillo');
            }}
          >
            <Minus className="h-4 w-4 text-yellow-600" /> Con observaciones
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
            onClick={async () => {
              setOpen(false);
              await cascadeUpdate(leafIds, 'rojo');
            }}
          >
            <X className="h-4 w-4 text-red-600" /> No compatible
          </button>
        </PopoverContent>
      </Popover>
    );
  };

  const renderNode = (node: Node, depth: number) => {
    const isOpen = expanded.has(node.key);
    const hasChildren = (node.children && node.children.length > 0) || (node.leaves && node.leaves.length > 0);
    return (
      <div key={node.key}>
        <div
          className={cn(
            'w-full flex items-center gap-2 py-2 pr-3 text-sm hover:bg-muted/60 transition-colors',
            depth === 0 && 'font-semibold text-foreground bg-muted/40',
            depth === 1 && 'font-medium',
          )}
          style={indentClass(depth)}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(node.key)}
            className="flex items-center gap-2 text-left flex-1 min-w-0"
          >
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-4 w-4 text-primary shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <span className="w-4" />
            )}
            <span className="truncate">{node.label}</span>
          </button>
          {productId && <StatusControl leafIds={node.leafIds} disabled={!isAdmin} />}
        </div>
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
                  {productId && (
                    <StatusControl leafIds={[leaf.catalog.id]} disabled={!isAdmin} />
                  )}
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
