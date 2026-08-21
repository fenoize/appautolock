import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Pencil, History, Truck } from 'lucide-react';

interface Proveedor {
  id: string;
  nombre: string;
  rut: string | null;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

const fmtDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

function useProveedores() {
  return useQuery({
    queryKey: ['proveedores', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return (data ?? []) as unknown as Proveedor[];
    },
  });
}

function useComprasStats() {
  return useQuery({
    queryKey: ['proveedores', 'compras-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_moves')
        .select('proveedor_id, created_at')
        .eq('tipo', 'compra')
        .not('proveedor_id', 'is', null);
      if (error) throw error;
      const map: Record<string, { count: number; ultima: string | null }> = {};
      for (const m of (data ?? []) as any[]) {
        const key = m.proveedor_id as string;
        const cur = map[key] ?? { count: 0, ultima: null };
        cur.count += 1;
        if (!cur.ultima || new Date(m.created_at) > new Date(cur.ultima)) cur.ultima = m.created_at;
        map[key] = cur;
      }
      return map;
    },
  });
}

function useHistorialProveedor(proveedorId: string | null) {
  return useQuery({
    queryKey: ['proveedores', 'historial', proveedorId],
    enabled: !!proveedorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_moves')
        .select(
          '*, product:products(nombre, sku), to_location:stock_locations!stock_moves_to_location_id_fkey(nombre)'
        )
        .eq('tipo', 'compra')
        .eq('proveedor_id', proveedorId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export default function ProveedoresPage() {
  const { data: proveedores, isLoading } = useProveedores();
  const { data: stats } = useComprasStats();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [historialFor, setHistorialFor] = useState<Proveedor | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Proveedor) => {
    setEditing(p);
    setFormOpen(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Proveedores"
        description="Administra los proveedores y su historial de compras"
        action={
          <Button onClick={openNew}>
            <Truck className="mr-2 h-4 w-4" />
            Nuevo proveedor
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-10 text-center text-muted-foreground">Cargando proveedores...</p>
          ) : !proveedores?.length ? (
            <p className="py-10 text-center text-muted-foreground">Aún no hay proveedores registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right"># Compras</TableHead>
                    <TableHead>Última compra</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedores.map((p) => {
                    const s = stats?.[p.id];
                    return (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setHistorialFor(p)}
                      >
                        <TableCell className="font-medium">{p.nombre}</TableCell>
                        <TableCell className="font-mono text-xs">{p.rut ?? '—'}</TableCell>
                        <TableCell>{p.contacto ?? '—'}</TableCell>
                        <TableCell className="text-sm">{p.email ?? '—'}</TableCell>
                        <TableCell className="text-sm">{p.telefono ?? '—'}</TableCell>
                        <TableCell className="text-right">{s?.count ?? 0}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(s?.ultima)}</TableCell>
                        <TableCell>
                          <Badge variant={p.activo ? 'default' : 'secondary'}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar proveedor"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(p);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Ver historial"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHistorialFor(p);
                              }}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProveedorFormDialog open={formOpen} onOpenChange={setFormOpen} proveedor={editing} />
      <HistorialDialog proveedor={historialFor} onClose={() => setHistorialFor(null)} />
    </PageContainer>
  );
}

function ProveedorFormDialog({
  open,
  onOpenChange,
  proveedor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proveedor: Proveedor | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!proveedor;
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    notas: '',
    activo: true,
  });
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  const key = open ? proveedor?.id ?? 'new' : null;
  if (key && initializedFor !== key) {
    setInitializedFor(key);
    setForm({
      nombre: proveedor?.nombre ?? '',
      rut: proveedor?.rut ?? '',
      contacto: proveedor?.contacto ?? '',
      email: proveedor?.email ?? '',
      telefono: proveedor?.telefono ?? '',
      direccion: proveedor?.direccion ?? '',
      notas: proveedor?.notas ?? '',
      activo: proveedor?.activo ?? true,
    });
  }
  if (!open && initializedFor !== null) setInitializedFor(null);

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre.trim(),
        rut: form.rut.trim() || null,
        contacto: form.contacto.trim() || null,
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
        notas: form.notas.trim() || null,
        activo: form.activo,
      };
      if (isEdit) {
        const { error } = await supabase
          .from('proveedores')
          .update(payload as any)
          .eq('id', proveedor!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('proveedores').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      toast({ title: isEdit ? 'Proveedor actualizado' : 'Proveedor creado' });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          <DialogDescription>Datos de contacto y comerciales del proveedor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Distribuidora XYZ" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input value={form.rut} onChange={(e) => set('rut', e.target.value)} placeholder="76.123.456-7" />
            </div>
            <div className="space-y-2">
              <Label>Contacto</Label>
              <Input value={form.contacto} onChange={(e) => set('contacto', e.target.value)} placeholder="Nombre del contacto" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="ventas@proveedor.cl" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={(e) => set('notas', e.target.value)} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Proveedor activo</Label>
              <p className="text-xs text-muted-foreground">Los inactivos no aparecen al registrar recepciones.</p>
            </div>
            <Switch checked={form.activo} onCheckedChange={(v) => set('activo', v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.nombre.trim() || mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorialDialog({ proveedor, onClose }: { proveedor: Proveedor | null; onClose: () => void }) {
  const { data: compras, isLoading } = useHistorialProveedor(proveedor?.id ?? null);

  return (
    <Dialog open={!!proveedor} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de compras — {proveedor?.nombre}</DialogTitle>
          <DialogDescription>Recepciones de stock registradas para este proveedor.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-10 text-center text-muted-foreground">Cargando historial...</p>
        ) : !compras?.length ? (
          <p className="py-10 text-center text-muted-foreground">Sin compras registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Bodega destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">{fmtDate(m.fecha ?? m.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{m.product?.nombre ?? 'Producto'}</div>
                      <div className="font-mono text-xs text-muted-foreground">{m.product?.sku}</div>
                    </TableCell>
                    <TableCell className="text-right">{Number(m.cantidad)}</TableCell>
                    <TableCell>{m.to_location?.nombre ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
