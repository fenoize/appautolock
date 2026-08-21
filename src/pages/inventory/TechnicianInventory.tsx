import { useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { HardHat, PackagePlus, Undo2, Boxes, Barcode } from 'lucide-react';

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

function useTechnicians() {
  return useQuery({
    queryKey: ['technician-inventory', 'technicians'],
    queryFn: async (): Promise<Technician[]> => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'tecnico');
      if (rolesError) throw rolesError;
      const ids = (roles ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];

      const [{ data: profiles, error: pErr }, { data: locations, error: lErr }] = await Promise.all([
        supabase.from('profiles').select('id, nombre, apellido, email, estado').in('id', ids).eq('estado', 'activo'),
        supabase.from('stock_locations').select('id, codigo, nombre, profile_id, tipo, activa').eq('tipo', 'camioneta').in('profile_id', ids),
      ]);
      if (pErr) throw pErr;
      if (lErr) throw lErr;

      return (profiles ?? [])
        .map((p: any) => {
          const loc = (locations ?? []).find((l: any) => l.profile_id === p.id);
          if (!loc) return null;
          return {
            id: p.id,
            nombre: p.nombre,
            apellido: p.apellido,
            email: p.email,
            location_id: loc.id,
            codigo: loc.codigo,
            location_nombre: loc.nombre,
          } as Technician;
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)) as Technician[];
    },
  });
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
  const { data: technicians, isLoading: loadingTechs } = useTechnicians();
  const { data: stock } = useTechnicianStock();
  const { data: serials } = useAllSerials();
  const { data: bodegaData } = useBodegaStock();
  const { data: bodegas } = useBodegas();
  const { data: products } = useActiveProducts();

  const [search, setSearch] = useState('');
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
      serial?: string;
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

      if (v.serial) {
        const { data: existing } = await supabase
          .from('product_serials')
          .select('id')
          .eq('serial_number', v.serial)
          .eq('product_id', v.product_id)
          .maybeSingle();
        if (existing) {
          const { error: uErr } = await supabase
            .from('product_serials')
            .update({ location_id: v.tech.location_id, estado: 'reservado' })
            .eq('id', existing.id);
          if (uErr) throw uErr;
        } else {
          const { error: iErr } = await supabase.from('product_serials').insert({
            product_id: v.product_id,
            serial_number: v.serial,
            location_id: v.tech.location_id,
            estado: 'reservado',
          } as any);
          if (iErr) throw iErr;
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
    if (!q) return serials ?? [];
    return (serials ?? []).filter(
      (s) =>
        s.serial_number.toLowerCase().includes(q) ||
        (s.products?.nombre ?? '').toLowerCase().includes(q)
    );
  }, [serials, search]);

  return (
    <PageContainer>
      <PageHeader
        title="Inventario por Técnico"
        description="Controla qué ítems tiene cada técnico en su camioneta"
      />

      <Tabs defaultValue="tecnicos">
        <TabsList>
          <TabsTrigger value="tecnicos">Por Técnico</TabsTrigger>
          <TabsTrigger value="seriales">Por Serial</TabsTrigger>
        </TabsList>

        <TabsContent value="tecnicos" className="mt-6">
          {loadingTechs ? (
            <p className="text-muted-foreground py-12 text-center">Cargando técnicos...</p>
          ) : !technicians?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HardHat className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">Sin técnicos con camioneta</p>
                <p className="text-sm text-muted-foreground">
                  Asocia una ubicación de tipo camioneta a cada técnico para gestionar su inventario.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {technicians.map((t) => {
                const items = itemsByLocation.get(t.location_id) ?? [];
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
                        </div>
                        <Badge variant="secondary">{t.codigo}</Badge>
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
                      <Button className="w-full" onClick={() => setAssignTech(t)}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Asignar ítem
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seriales" className="mt-6 space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por serie o producto..." />
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
                        <TableHead>Técnico actual</TableHead>
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
                            {s.stock_locations?.profiles
                              ? fullName(s.stock_locations.profiles.nombre, s.stock_locations.profiles.apellido)
                              : 'Sin asignar'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{s.stock_locations?.codigo ?? '—'}</Badge>
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
  onSubmit: (v: { product_id: string; cantidad: number; bodega_id: string; serial?: string; notas?: string }) => void;
  isPending: boolean;
}) {
  const [productId, setProductId] = useState('');
  const [serial, setSerial] = useState('');
  const [bodegaId, setBodegaId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState('');

  const product = products.find((p) => p.id === productId);
  const serializable = !!product?.serializable;

  const reset = () => {
    setProductId('');
    setSerial('');
    setBodegaId('');
    setCantidad(1);
    setNotas('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!productId || !bodegaId) {
      toast({ title: 'Datos incompletos', description: 'Selecciona producto y bodega de origen.', variant: 'destructive' });
      return;
    }
    onSubmit({
      product_id: productId,
      cantidad: serializable ? 1 : Number(cantidad) || 1,
      bodega_id: bodegaId,
      serial: serializable && serial.trim() ? serial.trim() : undefined,
      notas: notas.trim() || undefined,
    });
    reset();
  };

  return (
    <Dialog open={!!tech} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar ítem a {tech ? fullName(tech.nombre, tech.apellido) : ''}</DialogTitle>
          <DialogDescription>El ítem se traslada desde bodega a la camioneta del técnico.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} · {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serializable && (
            <div className="space-y-2">
              <Label>Número de serie (opcional)</Label>
              <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Ej: SN-000123" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Desde bodega</Label>
            <Select value={bodegaId} onValueChange={setBodegaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona bodega de origen" />
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

          {!serializable && (
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Asignando...' : 'Asignar'}
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
