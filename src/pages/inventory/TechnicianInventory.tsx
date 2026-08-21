import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { HardHat, PackagePlus, Undo2, Boxes, Barcode, Pencil, Truck, ChevronDown, Search, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';


interface Technician {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  location_id: string;
  codigo: string;
  location_nombre: string;
}

interface TechStockRow {
  location_id: string;
  product_id: string;
  producto: string;
  sku: string;
  serializable: boolean;
  cantidad_actual: number;
}

interface SerialRow {
  id: string;
  serial_number: string;
  product_id: string;
  location_id: string | null;
  estado: string | null;
  updated_at: string | null;
  products?: { nombre: string; sku: string } | null;
  stock_locations?: {
    id: string;
    codigo: string;
    nombre: string;
    tipo: string;
    profile_id: string | null;
    profiles?: { nombre: string; apellido: string | null } | null;
  } | null;
}

const initials = (nombre: string, apellido?: string | null) =>
  `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase() || '?';

const fullName = (nombre: string, apellido?: string | null) => `${nombre} ${apellido ?? ''}`.trim();

function useTechnicianProfiles() {
  return useQuery({
    queryKey: ['technician-inventory', 'techs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, profiles(id, nombre, apellido, email, estado)')
        .eq('role', 'tecnico');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

function useCamionetas() {
  return useQuery({
    queryKey: ['technician-inventory', 'camionetas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_locations')
        .select('*')
        .eq('tipo', 'camioneta');
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

function CamionetaDialog({
  tecnico,
  camioneta,
  open,
  onOpenChange,
}: {
  tecnico: any;
  camioneta: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!camioneta;
  const [nombre, setNombre] = useState(camioneta?.nombre ?? '');
  const [activa, setActiva] = useState(camioneta?.activa ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) setNombre(`Camioneta ${tecnico.nombre} ${tecnico.apellido ?? ''}`.trim());
  }, [tecnico, isEdit]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('stock_locations')
          .update({ nombre: nombre.trim(), activa })
          .eq('id', camioneta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('stock_locations').insert({
          nombre: nombre.trim(),
          tipo: 'camioneta',
          profile_id: tecnico.id,
          activa: true,
          codigo: `CAM-${tecnico.id.slice(0, 6).toUpperCase()}`,
        } as any);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['technician-inventory'] });
      toast({ title: isEdit ? 'Camioneta actualizada' : 'Camioneta asignada' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar camioneta' : 'Asignar camioneta'}</DialogTitle>
          <DialogDescription>
            {tecnico.nombre} {tecnico.apellido ?? ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la camioneta *</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Camioneta Norte" />
          </div>
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Activa</Label>
                <p className="text-xs text-muted-foreground">Las inactivas no aparecen en asignaciones.</p>
              </div>
              <Switch checked={activa} onCheckedChange={setActiva} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nombre.trim() || saving}>
            {isEdit ? 'Guardar' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function useTechnicianStock() {
  return useQuery({
    queryKey: ['technician-inventory', 'stock'],
    queryFn: async (): Promise<TechStockRow[]> => {
      const { data, error } = await (supabase as any).from('v_technician_stock').select('*');
      if (error) throw error;
      return (data ?? []).filter((r: any) => Number(r.cantidad_actual) > 0) as TechStockRow[];
    },
  });
}

function useAllSerials() {
  return useQuery({
    queryKey: ['technician-inventory', 'serials'],
    queryFn: async (): Promise<SerialRow[]> => {
      const { data, error } = await supabase
        .from('product_serials')
        .select(
          'id, serial_number, product_id, location_id, estado, updated_at, products(nombre, sku), stock_locations(id, codigo, nombre, tipo, profile_id, profiles(nombre, apellido))'
        )
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SerialRow[];
    },
  });
}

function useBodegaStock() {
  return useQuery({
    queryKey: ['technician-inventory', 'bodega-stock'],
    queryFn: async () => {
      const { data: locations, error: lErr } = await supabase
        .from('stock_locations')
        .select('id, nombre, codigo')
        .eq('tipo', 'bodega')
        .eq('activa', true);
      if (lErr) throw lErr;

      const { data: serials, error: sErr } = await supabase
        .from('product_serials')
        .select('id, serial_number, product_id, location_id, estado, products(nombre, sku)')
        .in('location_id', (locations ?? []).map((l: any) => l.id));
      if (sErr) throw sErr;

      return { locations: locations ?? [], serials: serials ?? [] };
    },
  });
}

function useBodegas() {
  return useQuery({
    queryKey: ['technician-inventory', 'bodegas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_locations')
        .select('id, codigo, nombre')
        .eq('tipo', 'bodega')
        .eq('activa', true)
        .order('nombre');
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useActiveProducts() {
  return useQuery({
    queryKey: ['technician-inventory', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, nombre, serializable')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function TechnicianInventory() {
  const queryClient = useQueryClient();
  const { data: tecnicos, isLoading: loadingTechs } = useTechnicianProfiles();
  const { data: camionetas } = useCamionetas();

  const technicians: (Technician & { camioneta: any | null })[] = useMemo(() => {
    return (tecnicos ?? [])
      .filter((t: any) => t.profiles)
      .map((t: any) => {
        const cam = (camionetas ?? []).find((c: any) => c.profile_id === t.user_id) ?? null;
        return {
          id: t.profiles.id,
          nombre: t.profiles.nombre,
          apellido: t.profiles.apellido,
          email: t.profiles.email,
          location_id: cam?.id ?? '',
          codigo: cam?.codigo ?? '',
          location_nombre: cam?.nombre ?? '',
          camioneta: cam,
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tecnicos, camionetas]);

  const { data: stock } = useTechnicianStock();
  const { data: serials } = useAllSerials();
  const { data: bodegaData } = useBodegaStock();
  const { data: bodegas } = useBodegas();
  const { data: products } = useActiveProducts();

  const [search, setSearch] = useState('');
  const [camionetaDialog, setCamionetaDialog] = useState<{ tecnico: any; camioneta: any | null } | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  const [assignTech, setAssignTech] = useState<Technician | null>(null);
  const [returnCtx, setReturnCtx] = useState<{
    tech: Technician;
    product_id: string;
    nombre: string;
    cantidad: number;
    serial_number?: string;
  } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['technician-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const assignMutation = useMutation({
    mutationFn: async (v: {
      tech: Technician;
      product_id: string;
      cantidad: number;
      bodega_id: string;
      serials: string[];
      notas?: string;
    }) => {
      const { error } = await supabase.from('stock_moves').insert({
        tipo: 'traslado',
        product_id: v.product_id,
        cantidad: v.cantidad,
        from_location_id: v.bodega_id,
        to_location_id: v.tech.location_id,
        referencia: 'Asignación a técnico',
        notas: v.notas || null,
        fecha: new Date().toISOString(),
      } as any);
      if (error) throw error;

      for (const serial of v.serials) {
        const { data: existing } = await supabase
          .from('product_serials')
          .select('id')
          .eq('serial_number', serial)
          .maybeSingle();
        if (existing) {
          await supabase
            .from('product_serials')
            .update({ location_id: v.tech.location_id, estado: 'disponible' } as any)
            .eq('id', existing.id);
        } else {
          await supabase.from('product_serials').insert({
            product_id: v.product_id,
            serial_number: serial,
            location_id: v.tech.location_id,
            estado: 'disponible',
          } as any);
        }
      }
    },
    onSuccess: () => {
      invalidate();
      setAssignTech(null);
      toast({ title: 'Ítem asignado', description: 'El ítem fue asignado al técnico.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const returnMutation = useMutation({
    mutationFn: async (v: { bodega_id: string; notas?: string }) => {
      if (!returnCtx) return;
      const { error } = await supabase.from('stock_moves').insert({
        tipo: 'traslado',
        product_id: returnCtx.product_id,
        cantidad: returnCtx.cantidad,
        from_location_id: returnCtx.tech.location_id,
        to_location_id: v.bodega_id,
        referencia: 'Devolución a bodega',
        notas: v.notas || null,
        fecha: new Date().toISOString(),
      } as any);
      if (error) throw error;

      if (returnCtx.serial_number) {
        const { error: uErr } = await supabase
          .from('product_serials')
          .update({ location_id: v.bodega_id, estado: 'disponible' })
          .eq('serial_number', returnCtx.serial_number);
        if (uErr) throw uErr;
      }
    },
    onSuccess: () => {
      invalidate();
      setReturnCtx(null);
      toast({ title: 'Devolución registrada', description: 'El ítem volvió a bodega.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const itemsByLocation = useMemo(() => {
    const map = new Map<string, { product_id: string; nombre: string; cantidad: number; serial?: string }[]>();
    (stock ?? []).forEach((r) => {
      const arr = map.get(r.location_id) ?? [];
      arr.push({ product_id: r.product_id, nombre: r.producto, cantidad: Number(r.cantidad_actual) });
      map.set(r.location_id, arr);
    });
    (serials ?? []).forEach((s) => {
      if (!s.location_id) return;
      const arr = map.get(s.location_id) ?? [];
      arr.push({
        product_id: s.product_id,
        nombre: s.products?.nombre ?? 'Producto',
        cantidad: 1,
        serial: s.serial_number,
      });
      map.set(s.location_id, arr);
    });
    return map;
  }, [stock, serials]);

  const filteredSerials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (serials ?? []).filter((s) => {
      const matchSearch =
        !q ||
        s.serial_number.toLowerCase().includes(q) ||
        (s.products?.nombre ?? '').toLowerCase().includes(q) ||
        (s.stock_locations?.nombre ?? '').toLowerCase().includes(q);
      const matchEstado = estadoFiltro === 'todos' || s.estado === estadoFiltro;
      return matchSearch && matchEstado;
    });
  }, [serials, search, estadoFiltro]);

  return (
    <PageContainer>
      <PageHeader
        title="Inventario por Técnico"
        description="Controla qué ítems tiene cada técnico en su camioneta"
      />

        <Tabs defaultValue="tecnicos">
          <TabsList>
            <TabsTrigger value="tecnicos">Por Técnico</TabsTrigger>
            <TabsTrigger value="bodegas">Bodegas</TabsTrigger>
            <TabsTrigger value="seriales">Por Serial</TabsTrigger>
          </TabsList>

          <TabsContent value="tecnicos" className="mt-6">
          {loadingTechs ? (
            <p className="text-muted-foreground py-12 text-center">Cargando técnicos...</p>
          ) : !technicians?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HardHat className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Sin técnicos registrados</p>
                <p className="text-sm text-muted-foreground">
                  Crea usuarios con rol técnico para gestionar su inventario.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {technicians.map((t) => {
                const items = t.location_id ? itemsByLocation.get(t.location_id) ?? [] : [];
                return (
                  <Card key={t.id} className="border-border/70">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                          {initials(t.nombre, t.apellido)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">{fullName(t.nombre, t.apellido)}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                          {t.camioneta ? (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Truck className="h-3 w-3" />
                              <span className="truncate">{t.camioneta.nombre}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => setCamionetaDialog({ tecnico: t, camioneta: t.camioneta })}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Sin camioneta
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setCamionetaDialog({ tecnico: t, camioneta: null })}
                              >
                                + Asignar
                              </Button>
                            </div>
                          )}
                        </div>
                        {t.codigo && <Badge variant="secondary">{t.codigo}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {items.length === 0 ? (
                        <div className="rounded-lg border border-dashed py-6 text-center">
                          <Boxes className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Sin ítems asignados</p>
                        </div>
                      ) : (
                        <ul className="divide-y">
                          {items.map((it, i) => (
                            <li key={`${it.product_id}-${it.serial ?? i}`} className="flex items-center gap-2 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{it.nombre}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {it.cantidad} un.
                                  {it.serial ? ` · Serie ${it.serial}` : ''}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setReturnCtx({
                                    tech: t,
                                    product_id: it.product_id,
                                    nombre: it.nombre,
                                    cantidad: it.cantidad,
                                    serial_number: it.serial,
                                  })
                                }
                              >
                                <Undo2 className="mr-1 h-4 w-4" />
                                Devolver
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button className="w-full" onClick={() => setAssignTech(t)} disabled={!t.location_id}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        {t.location_id ? 'Asignar ítem' : 'Requiere camioneta'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {camionetaDialog && (
            <CamionetaDialog
              tecnico={camionetaDialog.tecnico}
              camioneta={camionetaDialog.camioneta}
              open={!!camionetaDialog}
              onOpenChange={(v) => !v && setCamionetaDialog(null)}
            />
          )}

        </TabsContent>

        <TabsContent value="bodegas" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(bodegaData?.locations ?? []).map((loc: any) => {
              const items = (bodegaData?.serials ?? []).filter((s: any) => s.location_id === loc.id);
              const byEstado = {
                disponible: items.filter((s: any) => s.estado === 'disponible'),
                reservado: items.filter((s: any) => s.estado === 'reservado'),
                defectuoso: items.filter((s: any) => s.estado === 'defectuoso'),
              };
              return (
                <Card key={loc.id} className="border-border/70">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{loc.nombre}</CardTitle>
                      <Badge variant="secondary">{loc.codigo}</Badge>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/30">{byEstado.disponible.length} disponibles</Badge>
                      {byEstado.reservado.length > 0 && <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">{byEstado.reservado.length} reservados</Badge>}
                      {byEstado.defectuoso.length > 0 && <Badge className="bg-red-500/10 text-red-700 border-red-500/30">{byEstado.defectuoso.length} defectuosos</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="rounded-lg border border-dashed py-6 text-center">
                        <Boxes className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Sin equipos en bodega</p>
                      </div>
                    ) : (
                      <ul className="divide-y max-h-64 overflow-y-auto">
                        {items.map((s: any) => (
                          <li key={s.id} className="flex items-center gap-2 py-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{s.products?.nombre ?? '—'}</p>
                              <p className="text-xs font-mono text-muted-foreground">{s.serial_number}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                s.estado === 'disponible' ? 'border-green-500/40 text-green-700' :
                                s.estado === 'reservado' ? 'border-blue-500/40 text-blue-700' :
                                s.estado === 'defectuoso' ? 'border-red-500/40 text-red-700' :
                                'border-border text-muted-foreground'
                              }
                            >
                              {s.estado}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="seriales" className="mt-6 space-y-4">
          <div className="flex gap-3 items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por serie o producto..." className="flex-1" />
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="defectuoso">Defectuoso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredSerials.length === 0 ? (
                <div className="py-12 text-center">
                  <Barcode className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">Sin seriales asignados</p>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay números de serie en camionetas de técnicos.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Última actualización</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSerials.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">{s.serial_number}</TableCell>
                          <TableCell>{s.products?.nombre ?? '—'}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{s.stock_locations?.nombre ?? '—'}</p>
                              <p className="text-xs text-muted-foreground capitalize">{s.stock_locations?.tipo ?? ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{s.estado ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {s.updated_at ? new Date(s.updated_at).toLocaleString('es-CL') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <AssignDialog
        tech={assignTech}
        products={products ?? []}
        bodegas={bodegas ?? []}
        onClose={() => setAssignTech(null)}
        onSubmit={(v) => assignTech && assignMutation.mutate({ ...v, tech: assignTech })}
        isPending={assignMutation.isPending}
      />

      <ReturnDialog
        ctx={returnCtx}
        bodegas={bodegas ?? []}
        onClose={() => setReturnCtx(null)}
        onSubmit={(v) => returnMutation.mutate(v)}
        isPending={returnMutation.isPending}
      />
    </PageContainer>
  );
}

function AssignDialog({
  tech,
  products,
  bodegas,
  onClose,
  onSubmit,
  isPending,
}: {
  tech: Technician | null;
  products: any[];
  bodegas: any[];
  onClose: () => void;
  onSubmit: (v: { product_id: string; cantidad: number; bodega_id: string; serials: string[]; notas?: string }) => void;
  isPending: boolean;
}) {
  const [productId, setProductId] = useState('');
  const [bodegaId, setBodegaId] = useState('');
  const [notas, setNotas] = useState('');
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [manualSerial, setManualSerial] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const product = products.find((p) => p.id === productId);
  const isSerializable = !!product?.serializable;

  const { data: availableSerials = [], isLoading: loadingSerials } = useQuery({
    queryKey: ['assign-available-serials', productId, bodegaId],
    queryFn: async () => {
      if (!productId || !bodegaId) return [];
      const { data } = await supabase
        .from('product_serials')
        .select('id, serial_number')
        .eq('product_id', productId)
        .eq('location_id', bodegaId)
        .eq('estado', 'disponible')
        .order('serial_number');
      return data ?? [];
    },
    enabled: !!productId && !!bodegaId && isSerializable,
  });

  const toggleSerial = (serial: string) => {
    setSelectedSerials((prev) =>
      prev.includes(serial) ? prev.filter((s) => s !== serial) : [...prev, serial]
    );
  };

  const toggleAll = () => {
    setSelectedSerials(
      selectedSerials.length === availableSerials.length
        ? []
        : availableSerials.map((s: any) => s.serial_number)
    );
  };

  const reset = () => {
    setProductId('');
    setBodegaId('');
    setNotas('');
    setSelectedSerials([]);
    setManualSerial('');
    setCantidad(1);
  };

  const handleClose = () => { reset(); onClose(); };

  const canSubmit = productId && bodegaId &&
    (isSerializable ? selectedSerials.length > 0 || manualSerial.trim() : cantidad > 0);

  const submit = () => {
    if (!canSubmit) return;
    const serials = isSerializable
      ? [...selectedSerials, ...(manualSerial.trim() ? [manualSerial.trim().toUpperCase()] : [])]
      : [];
    onSubmit({
      product_id: productId,
      cantidad: isSerializable ? serials.length : cantidad,
      bodega_id: bodegaId,
      serials,
      notas: notas.trim() || undefined,
    });
    reset();
  };

  return (
    <Dialog open={!!tech} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Asignar a {tech ? fullName(tech.nombre, tech.apellido) : ''}</DialogTitle>
          <DialogDescription>Selecciona los equipos a trasladar a la camioneta del técnico.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={productId} onValueChange={(v) => { setProductId(v); setSelectedSerials([]); }}>
              <SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.sku} · {p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Desde bodega</Label>
            <Select value={bodegaId} onValueChange={(v) => { setBodegaId(v); setSelectedSerials([]); }}>
              <SelectTrigger><SelectValue placeholder="Selecciona bodega de origen" /></SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSerializable && productId && bodegaId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Seriales disponibles en bodega</Label>
                {availableSerials.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={toggleAll}>
                    {selectedSerials.length === availableSerials.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
                )}
              </div>

              {loadingSerials ? (
                <p className="text-sm text-muted-foreground py-2">Cargando seriales...</p>
              ) : availableSerials.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  No hay seriales disponibles en esta bodega. Registra ingresos en Inventario / Recepciones.
                </p>
              ) : (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {availableSerials.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                      <input
                        type="checkbox"
                        checked={selectedSerials.includes(s.serial_number)}
                        onChange={() => toggleSerial(s.serial_number)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="font-mono text-sm">{s.serial_number}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-1 pt-1">
                <Label className="text-xs text-muted-foreground">O ingresa un serial manualmente</Label>
                <Input
                  placeholder="Ej: SN-000099"
                  value={manualSerial}
                  onChange={(e) => setManualSerial(e.target.value.toUpperCase())}
                  className="font-mono text-sm"
                />
              </div>

              {(selectedSerials.length > 0 || manualSerial.trim()) && (
                <p className="text-xs font-medium text-primary">
                  {selectedSerials.length + (manualSerial.trim() ? 1 : 0)} equipo(s) seleccionado(s)
                </p>
              )}
            </div>
          )}

          {!isSerializable && productId && (
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || isPending}>
            {isPending ? 'Asignando...' : `Asignar${isSerializable && (selectedSerials.length + (manualSerial.trim() ? 1 : 0)) > 0 ? ` (${selectedSerials.length + (manualSerial.trim() ? 1 : 0)})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReturnDialog({
  ctx,
  bodegas,
  onClose,
  onSubmit,
  isPending,
}: {
  ctx: { nombre: string; serial_number?: string } | null;
  bodegas: any[];
  onClose: () => void;
  onSubmit: (v: { bodega_id: string; notas?: string }) => void;
  isPending: boolean;
}) {
  const [bodegaId, setBodegaId] = useState('');
  const [notas, setNotas] = useState('');

  const handleClose = () => {
    setBodegaId('');
    setNotas('');
    onClose();
  };

  return (
    <Dialog open={!!ctx} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Devolver a bodega</DialogTitle>
          <DialogDescription>
            {ctx?.nombre}
            {ctx?.serial_number ? ` · Serie ${ctx.serial_number}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Devolver a</Label>
            <Select value={bodegaId} onValueChange={setBodegaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona bodega destino" />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.codigo} · {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!bodegaId) {
                toast({ title: 'Selecciona una bodega', variant: 'destructive' });
                return;
              }
              onSubmit({ bodega_id: bodegaId, notas: notas.trim() || undefined });
              setBodegaId('');
              setNotas('');
            }}
            disabled={isPending}
          >
            {isPending ? 'Guardando...' : 'Devolver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
