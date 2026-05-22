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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Search, ChevronRight, ChevronDown, History, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
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
  amarillo: 'Compatible con observaciones',
  rojo: 'No compatible',
  sin_datos: 'Sin datos',
  mixto: 'Mixto',
};

/** 4-circle traffic light. `status` highlights one circle; 'mixto' dims all equally. */
const TrafficLight = ({
  status,
  onSelect,
  disabled,
  size = 'md',
}: {
  status: NodeStatus;
  onSelect?: (s: CompatEstado | 'sin_datos') => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) => {
  const dot = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const circles: { key: CompatEstado | 'sin_datos'; color: string; ring: string; title: string }[] = [
    { key: 'verde', color: 'bg-green-500', ring: 'ring-green-500', title: 'Compatible' },
    { key: 'amarillo', color: 'bg-yellow-500', ring: 'ring-yellow-500', title: 'Compatible con observaciones' },
    { key: 'rojo', color: 'bg-red-500', ring: 'ring-red-500', title: 'No compatible' },
    { key: 'sin_datos', color: 'bg-muted-foreground/40', ring: 'ring-muted-foreground/40', title: 'Sin datos' },
  ];
  const mixto = status === 'mixto';
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-1.5 py-0.5"
      title={STATUS_LABEL[status]}
    >
      {circles.map((c) => {
        const active = !mixto && status === c.key;
        const dim = !mixto && !active;
        return (
          <button
            key={c.key}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(c.key);
            }}
            title={c.title}
            className={cn(
              'rounded-full transition-all',
              dot,
              c.color,
              mixto && 'opacity-60',
              active && `ring-2 ring-offset-1 ring-offset-background ${c.ring} scale-110`,
              dim && 'opacity-25 hover:opacity-70',
              disabled ? 'cursor-default' : 'cursor-pointer',
            )}
            aria-label={c.title}
          />
        );
      })}
    </div>
  );
};

export default function CompatibilityMatrix() {
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const { data: products } = useProducts();
  const allProducts = useMemo(() => products ?? [], [products]);
  const [productId, setProductId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterMarca, setFilterMarca] = useState<string>('all');
  const [filterAnio, setFilterAnio] = useState<string>('all');
  const [filterCombustible, setFilterCombustible] = useState<string>('all');
  const [filterEncendido, setFilterEncendido] = useState<string>('all');
  const { data: catalog = [] } = useVehicleCatalog(search);
  const { data: compats = [] } = useProductCompatibility(productId);
  const compatByCat = useMemo(() => {
    const map = new Map<string, ProductCompatibility>();
    compats.forEach((c) => map.set(c.vehicle_catalog_id, c));
    return map;
  }, [compats]);

  // Derive unique filter options from the catalog
  const filterOptions = useMemo(() => {
    const marcas = new Set<string>();
    const anios = new Set<number>();
    const combustibles = new Set<string>();
    const encendidos = new Set<string>();
    for (const c of catalog) {
      if (c.marca) marcas.add(c.marca);
      if (c.tipo_combustible) combustibles.add(c.tipo_combustible);
      if (c.tipo_encendido) encendidos.add(c.tipo_encendido);
      const desde = c.anio_desde ?? null;
      const hasta = c.anio_hasta ?? null;
      if (desde && hasta && hasta >= desde) {
        const span = Math.min(hasta - desde + 1, 60);
        for (let i = 0; i < span; i++) anios.add(desde + i);
      } else if (desde) anios.add(desde);
      else if (hasta) anios.add(hasta);
    }
    return {
      marcas: Array.from(marcas).sort((a, b) => a.localeCompare(b)),
      anios: Array.from(anios).sort((a, b) => b - a),
      combustibles: Array.from(combustibles).sort((a, b) => a.localeCompare(b)),
      encendidos: Array.from(encendidos).sort((a, b) => a.localeCompare(b)),
    };
  }, [catalog]);

  // Apply filters on top of the search-narrowed catalog
  const filteredCatalog = useMemo(() => {
    const anio = filterAnio !== 'all' ? Number(filterAnio) : null;
    return catalog.filter((c) => {
      if (filterMarca !== 'all' && c.marca !== filterMarca) return false;
      if (filterCombustible !== 'all' && (c.tipo_combustible ?? '') !== filterCombustible) return false;
      if (filterEncendido !== 'all' && (c.tipo_encendido ?? '') !== filterEncendido) return false;
      if (anio !== null) {
        const desde = c.anio_desde ?? null;
        const hasta = c.anio_hasta ?? null;
        if (desde && hasta) {
          if (anio < desde || anio > hasta) return false;
        } else if (desde) {
          if (desde !== anio) return false;
        } else if (hasta) {
          if (hasta !== anio) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [catalog, filterMarca, filterAnio, filterCombustible, filterEncendido]);

  const hasActiveFilters =
    filterMarca !== 'all' || filterAnio !== 'all' || filterCombustible !== 'all' || filterEncendido !== 'all';

  const resetFilters = () => {
    setFilterMarca('all');
    setFilterAnio('all');
    setFilterCombustible('all');
    setFilterEncendido('all');
  };

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

  // Pending bulk action awaiting confirmation
  type PendingChange = {
    leafIds: string[];
    nextEstado: CompatEstado | 'sin_datos';
    observaciones?: string | null;
    nodeLabel?: string;
  };
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const STATUS_PRETTY: Record<CompatEstado | 'sin_datos', string> = {
    verde: '🟢 Compatible',
    amarillo: '🟡 Compatible con observaciones',
    rojo: '🔴 No compatible',
    sin_datos: '⚪ Sin datos',
  };

  // Core write — applies change + logs history rows in one batch
  const applyChange = async (
    catalogIds: string[],
    nextEstado: CompatEstado | 'sin_datos',
    observacionesOverride: string | null | undefined,
    revertOfBatchId?: string,
  ) => {
    if (!productId || catalogIds.length === 0) return;
    catalogIds = Array.from(new Set(catalogIds));

    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    const batchId = (crypto as any).randomUUID();

    // Snapshot previous state from current cache
    const snapshots = catalogIds.map((vid) => {
      const ex = compatByCat.get(vid);
      return {
        vehicle_catalog_id: vid,
        estado_anterior: ex?.estado ?? null,
        observaciones_anteriores: ex?.observaciones ?? null,
      };
    });

    if (nextEstado === 'sin_datos') {
      const { error } = await (supabase as any)
        .from('product_compatibility')
        .delete()
        .eq('product_id', productId)
        .in('vehicle_catalog_id', catalogIds);
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      const rows = catalogIds.map((vid) => {
        const existing = compatByCat.get(vid);
        const obs =
          observacionesOverride !== undefined ? observacionesOverride : existing?.observaciones ?? null;
        return {
          product_id: productId,
          vehicle_catalog_id: vid,
          estado: nextEstado,
          observaciones: obs,
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
    }

    // Log history (one row per affected catalog id)
    const historyRows = snapshots.map((s) => ({
      batch_id: batchId,
      product_id: productId,
      vehicle_catalog_id: s.vehicle_catalog_id,
      estado_anterior: s.estado_anterior,
      observaciones_anteriores: s.observaciones_anteriores,
      estado_nuevo: nextEstado === 'sin_datos' ? null : nextEstado,
      observaciones_nuevas:
        nextEstado === 'sin_datos'
          ? null
          : observacionesOverride !== undefined
            ? observacionesOverride
            : s.observaciones_anteriores,
      changed_by: userId,
      revert_of_batch_id: revertOfBatchId ?? null,
    }));
    await (supabase as any).from('product_compatibility_history').insert(historyRows);

    // If this is a revert, mark original batch as reverted
    if (revertOfBatchId) {
      await (supabase as any)
        .from('product_compatibility_history')
        .update({ reverted: true })
        .eq('batch_id', revertOfBatchId);
    }

    queryClient.invalidateQueries({ queryKey: ['product_compatibility'] });
    queryClient.invalidateQueries({ queryKey: ['compatibility_for_vehicle'] });
    queryClient.invalidateQueries({ queryKey: ['compatibility_history', productId] });
    toast.success(`${catalogIds.length} registro(s) actualizados`);
  };

  // Gate: if action affects >1 record, ask for confirmation first
  const cascadeUpdate = async (
    catalogIds: string[],
    nextEstado: CompatEstado | 'sin_datos',
    observacionesOverride?: string | null,
    nodeLabel?: string,
  ) => {
    const unique = Array.from(new Set(catalogIds));
    if (unique.length > 1) {
      setPendingChange({
        leafIds: unique,
        nextEstado,
        observaciones: observacionesOverride,
        nodeLabel,
      });
      return;
    }
    await applyChange(unique, nextEstado, observacionesOverride);
  };

  const confirmPending = async () => {
    if (!pendingChange) return;
    await applyChange(pendingChange.leafIds, pendingChange.nextEstado, pendingChange.observaciones);
    setPendingChange(null);
  };

  // ---- History query ----
  const { data: history = [] } = useQuery({
    queryKey: ['compatibility_history', productId],
    enabled: !!productId && historyOpen,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('product_compatibility_history')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Group history by batch_id
  const historyBatches = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const h of history) {
      if (!map.has(h.batch_id)) map.set(h.batch_id, []);
      map.get(h.batch_id)!.push(h);
    }
    const batches = Array.from(map.entries()).map(([batch_id, rows]) => ({
      batch_id,
      rows,
      changed_at: rows[0].changed_at,
      changed_by: rows[0].changed_by,
      estado_nuevo: rows[0].estado_nuevo,
      reverted: rows[0].reverted,
      revert_of_batch_id: rows[0].revert_of_batch_id,
      count: rows.length,
    }));
    return batches.sort((a, b) => (a.changed_at < b.changed_at ? 1 : -1));
  }, [history]);

  // Fetch user names for history
  const userIds = useMemo(
    () => Array.from(new Set(history.map((h) => h.changed_by).filter(Boolean))),
    [history],
  );
  const { data: userMap = {} } = useQuery({
    queryKey: ['history_user_names', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,nombre,apellido,email')
        .in('id', userIds as string[]);
      const m: Record<string, string> = {};
      (data ?? []).forEach((u: any) => {
        m[u.id] = [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email || u.id.slice(0, 8);
      });
      return m;
    },
  });

  const revertBatch = async (batch: any) => {
    if (!productId) return;
    // For each row in the batch, restore previous state
    const byPrev = new Map<string, { ids: string[]; obs: string | null }>();
    // Group rows by (estado_anterior, observaciones_anteriores)
    const groups = new Map<string, { estado: CompatEstado | 'sin_datos'; obs: string | null; ids: string[] }>();
    for (const r of batch.rows) {
      const estado: CompatEstado | 'sin_datos' = r.estado_anterior ?? 'sin_datos';
      const obs = r.observaciones_anteriores ?? null;
      const key = `${estado}|${obs ?? ''}`;
      if (!groups.has(key)) groups.set(key, { estado, obs, ids: [] });
      groups.get(key)!.ids.push(r.vehicle_catalog_id);
    }
    const batchId = (crypto as any).randomUUID();
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    for (const [, g] of groups) {
      await applyChange(g.ids, g.estado, g.obs, batch.batch_id);
    }
    toast.success('Cambios revertidos');
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

    for (const c of filteredCatalog) {
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
  }, [filteredCatalog]);

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

  // Shared observation for a node: if all leafIds have estado=amarillo with the same observation,
  // return that text. Otherwise (mixed states, single leaf with text, etc.) return that leaf's text
  // when there's only one leaf — else null.
  const sharedObservation = (leafIds: string[]): string | null => {
    if (leafIds.length === 0) return null;
    const obsSet = new Set<string>();
    let anyAmarillo = false;
    for (const id of leafIds) {
      const c = compatByCat.get(id);
      if (!c) return null;
      if (c.estado !== 'amarillo') return null;
      anyAmarillo = true;
      obsSet.add((c.observaciones ?? '').trim());
    }
    if (!anyAmarillo || obsSet.size !== 1) return null;
    const only = Array.from(obsSet)[0];
    return only || null;
  };

  const truncate = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  // Clickable traffic light + popover for yellow (with observations textarea)
  const StatusControl = ({
    leafIds,
    disabled,
  }: {
    leafIds: string[];
    disabled?: boolean;
  }) => {
    const status = nodeStatus(leafIds);
    const [yellowOpen, setYellowOpen] = useState(false);
    const [obsDraft, setObsDraft] = useState('');

    const openYellow = () => {
      const existing = sharedObservation(leafIds) ?? '';
      setObsDraft(existing);
      setYellowOpen(true);
    };

    const handleSelect = async (next: CompatEstado | 'sin_datos') => {
      if (next === 'amarillo') {
        openYellow();
        return;
      }
      await cascadeUpdate(leafIds, next);
    };

    const saveYellow = async () => {
      await cascadeUpdate(leafIds, 'amarillo', obsDraft.trim() || null);
      setYellowOpen(false);
    };

    return (
      <Popover open={yellowOpen} onOpenChange={setYellowOpen}>
        <PopoverTrigger asChild>
          {/* Anchor for the popover — invisible point next to the traffic light */}
          <span className="relative">
            <TrafficLight
              status={status}
              disabled={disabled}
              onSelect={disabled ? undefined : handleSelect}
            />
          </span>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-3"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <p className="text-sm font-semibold">Compatible con observaciones</p>
            <Textarea
              autoFocus
              rows={3}
              value={obsDraft}
              onChange={(e) => setObsDraft(e.target.value)}
              placeholder="Describe la observación o condición de compatibilidad…"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setYellowOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={saveYellow}>
                Guardar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderNode = (node: Node, depth: number) => {
    const isOpen = expanded.has(node.key);
    const hasChildren = (node.children && node.children.length > 0) || (node.leaves && node.leaves.length > 0);
    const shared = productId ? sharedObservation(node.leafIds) : null;
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
          {shared && (
            <span
              className="hidden md:inline text-xs text-muted-foreground italic truncate max-w-[260px]"
              title={shared}
            >
              {truncate(shared)}
            </span>
          )}
          {productId && <StatusControl leafIds={node.leafIds} disabled={!isAdmin} />}
        </div>
        {isOpen && (
          <div>
            {node.children?.map((c) => renderNode(c, depth + 1))}
            {node.leaves?.map((leaf) => {
              const cmp = compatByCat.get(leaf.catalog.id);
              const obs = cmp?.observaciones?.trim() || '';
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
                  <span
                    className="flex-1 text-xs text-muted-foreground truncate italic"
                    title={obs || undefined}
                  >
                    {obs ? truncate(obs) : '—'}
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
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-xs text-muted-foreground">Marca</Label>
                <Select value={filterMarca} onValueChange={setFilterMarca}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filterOptions.marcas.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[110px]">
                <Label className="text-xs text-muted-foreground">Año</Label>
                <Select value={filterAnio} onValueChange={setFilterAnio}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions.anios.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-xs text-muted-foreground">Combustible</Label>
                <Select value={filterCombustible} onValueChange={setFilterCombustible}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions.combustibles.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-xs text-muted-foreground">Encendido</Label>
                <Select value={filterEncendido} onValueChange={setFilterEncendido}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions.encendidos.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                  Limpiar filtros
                </Button>
              )}
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
