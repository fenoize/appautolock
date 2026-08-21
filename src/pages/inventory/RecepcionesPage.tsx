import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { PackagePlus } from 'lucide-react';
import { ProveedorCombobox } from '@/components/proveedores/ProveedorCombobox';

interface ProductOption {
  id: string;
  sku: string;
  nombre: string;
  serializable: boolean;
}

function useProductOptions() {
  return useQuery({
    queryKey: ['recepciones', 'products'],
    queryFn: async (): Promise<ProductOption[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, nombre, serializable')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return (data ?? []) as ProductOption[];
    },
  });
}

function useBodegas() {
  return useQuery({
    queryKey: ['recepciones', 'bodegas'],
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

function useRecepciones() {
  return useQuery({
    queryKey: ['recepciones', 'historial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_moves')
        .select(
          '*, product:products(nombre, sku, serializable), to_location:stock_locations!stock_moves_to_location_id_fkey(nombre)'
        )
        .eq('tipo', 'compra')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export default function RecepcionesPage() {
  const queryClient = useQueryClient();
  const { data: products } = useProductOptions();
  const { data: bodegas } = useBodegas();
  const { data: recepciones, isLoading } = useRecepciones();
  const [open, setOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['recepciones'] });
    queryClient.invalidateQueries({ queryKey: ['bodegas-page'] });
    queryClient.invalidateQueries({ queryKey: ['technician-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Recepciones"
        description="Ingreso de equipos y productos a bodega"
        action={
          <Button onClick={() => setOpen(true)}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Nueva recepción
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de recepciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-10 text-center text-muted-foreground">Cargando recepciones...</p>
          ) : !recepciones?.length ? (
            <p className="py-10 text-center text-muted-foreground">Aún no hay recepciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Bodega destino</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recepciones.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(m.fecha ?? m.created_at).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{m.product?.nombre ?? 'Producto'}</div>
                        <div className="font-mono text-xs text-muted-foreground">{m.product?.sku}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(m.cantidad)}
                        {m.product?.serializable && (
                          <Badge variant="outline" className="ml-2">
                            seriales
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{m.to_location?.nombre ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.referencia ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.notas ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <NuevaRecepcionDialog
        open={open}
        onOpenChange={setOpen}
        products={products ?? []}
        bodegas={bodegas ?? []}
        onSuccess={() => {
          invalidate();
          setOpen(false);
        }}
      />
    </PageContainer>
  );
}

function NuevaRecepcionDialog({
  open,
  onOpenChange,
  products,
  bodegas,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: ProductOption[];
  bodegas: any[];
  onSuccess: () => void;
}) {
  const [productId, setProductId] = useState('');
  const [bodegaId, setBodegaId] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [sinSerial, setSinSerial] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [proveedorId, setProveedorId] = useState<string | null>(null);
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const product = products.find((p) => p.id === productId);
  const esSerializable = !!product?.serializable;

  const seriales = serialInput
    .split('\n')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const cantidadNum = Number(cantidad);
  const canSubmit =
    !!productId &&
    !!bodegaId &&
    (esSerializable && !sinSerial ? seriales.length > 0 : cantidadNum > 0);

  const handleSinSerialChange = (v: boolean) => {
    setSinSerial(v);
    if (v) setSerialInput('');
    else setCantidad('');
  };

  const reset = () => {
    setProductId('');
    setBodegaId('');
    setSerialInput('');
    setSinSerial(false);
    setCantidad('');
    setProveedorId(null);
    setProveedorNombre('');
    setNotas('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const total = esSerializable && !sinSerial ? seriales.length : cantidadNum;

      const { error: moveErr } = await supabase.from('stock_moves').insert({
        tipo: 'compra',
        product_id: productId,
        cantidad: total,
        to_location_id: bodegaId,
        proveedor_id: proveedorId,
        referencia: proveedorNombre ? `Compra: ${proveedorNombre}` : 'Recepción de compra',
        notas: notas || null,
        fecha: new Date().toISOString(),
      } as any);
      if (moveErr) throw moveErr;

      if (esSerializable && sinSerial) {
        const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const placeholders = Array.from({ length: cantidadNum }, (_, i) => ({
          serial_number: `PEND-${fecha}-${String(i + 1).padStart(3, '0')}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`,
          product_id: productId,
          location_id: bodegaId,
          estado: 'sin_serial',
        }));
        const { error: insErr } = await supabase.from('product_serials').insert(placeholders as any);
        if (insErr) throw insErr;
      } else if (esSerializable) {
        const { data: existing } = await supabase
          .from('product_serials')
          .select('serial_number')
          .in('serial_number', seriales);
        const existingSet = new Set((existing || []).map((e: any) => e.serial_number));

        const nuevos = seriales.filter((s) => !existingSet.has(s));
        if (nuevos.length > 0) {
          const { error: insErr } = await supabase.from('product_serials').insert(
            nuevos.map((s) => ({
              serial_number: s,
              product_id: productId,
              location_id: bodegaId,
              estado: 'disponible',
            })) as any
          );
          if (insErr) throw insErr;
        }

        const existentes = seriales.filter((s) => existingSet.has(s));
        if (existentes.length > 0) {
          await supabase
            .from('product_serials')
            .update({ location_id: bodegaId, estado: 'disponible' } as any)
            .in('serial_number', existentes);
        }
      }

      const bodegaNombre = bodegas.find((b) => b.id === bodegaId)?.nombre ?? 'bodega';
      toast({
        title: 'Recepción registrada',
        description: `${total} unidad(es) ingresadas a ${bodegaNombre}.`,
      });
      reset();
      onSuccess();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva recepción</DialogTitle>
          <DialogDescription>
            Registra productos o equipos que llegan a bodega.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Producto *</Label>
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

          <div className="space-y-2">
            <Label>Bodega de ingreso *</Label>
            <Select value={bodegaId} onValueChange={setBodegaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona bodega" />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {esSerializable && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch id="sin-serial" checked={sinSerial} onCheckedChange={handleSinSerialChange} />
              <div>
                <Label htmlFor="sin-serial" className="cursor-pointer">
                  Recibir sin serial
                </Label>
                <p className="text-xs text-muted-foreground">
                  Para cajas cerradas. El serial real se puede actualizar después desde Bodegas.
                </p>
              </div>
            </div>
          )}

          {esSerializable && !sinSerial ? (
            <div className="space-y-2">
              <Label>
                Números de serie *
                {seriales.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({seriales.length} detectado{seriales.length !== 1 ? 's' : ''})
                  </span>
                )}
              </Label>
              <Textarea
                placeholder={'SN-000001\nSN-000002\nSN-000003'}
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Un serial por línea. Se ignoran espacios y se convierten a mayúsculas.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={sinSerial ? 'Ej: 4' : 'Ej: 25'}
                disabled={!productId}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Proveedor (opcional)</Label>
            <ProveedorCombobox
              value={proveedorId}
              onChange={(id, nombre) => {
                setProveedorId(id);
                setProveedorNombre(nombre);
              }}
              placeholder="Buscar o crear proveedor"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej: Factura #1234" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Registrando...' : 'Registrar recepción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
