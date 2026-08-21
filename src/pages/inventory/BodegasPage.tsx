import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight, Hash, Warehouse } from 'lucide-react';

interface Bodega {
  id: string;
  codigo: string;
  nombre: string;
}

interface ProductRow {
  key: string;
  product_id: string;
  nombre: string;
  sku: string;
  disponible: number;
  reservado: number;
  total: number;
  sinSerial?: boolean;
  serialId?: string;
  serialNumber?: string;
}

function useBodegasStock() {
  return useQuery({
    queryKey: ['bodegas-page', 'stock'],
    queryFn: async () => {
      const { data: locations, error: lErr } = await supabase
        .from('stock_locations')
        .select('id, codigo, nombre')
        .eq('tipo', 'bodega')
        .eq('activa', true)
        .order('nombre');
      if (lErr) throw lErr;

      const ids = (locations ?? []).map((l) => l.id);
      if (!ids.length) return { bodegas: [] as Bodega[], rowsByBodega: new Map<string, ProductRow[]>() };

      const [{ data: view, error: vErr }, { data: serials, error: sErr }] = await Promise.all([
        (supabase as any).from('stock_by_location').select('*').in('location_id', ids),
        supabase
          .from('product_serials')
          .select('id, serial_number, product_id, location_id, estado, products(nombre, sku)')
          .in('location_id', ids),
      ]);
      if (vErr) throw vErr;
      if (sErr) throw sErr;

      const rowsByBodega = new Map<string, Map<string, ProductRow>>();
      const bucket = (locationId: string) => {
        if (!rowsByBodega.has(locationId)) rowsByBodega.set(locationId, new Map());
        return rowsByBodega.get(locationId)!;
      };
      const ensure = (locationId: string, product_id: string, nombre: string, sku: string) => {
        const b = bucket(locationId);
        if (!b.has(product_id)) {
          b.set(product_id, { key: product_id, product_id, nombre, sku, disponible: 0, reservado: 0, total: 0 });
        }
        return b.get(product_id)!;
      };

      ((view ?? []) as any[]).forEach((r) => {
        const total = Number(r.stock_actual ?? 0);
        const reservado = Number(r.reservas_activas ?? 0);
        if (total <= 0 && reservado <= 0) return;
        const row = ensure(r.location_id, r.product_id, r.nombre ?? 'Producto', r.sku ?? '');
        row.total += total;
        row.reservado += reservado;
        row.disponible += Math.max(total - reservado, 0);
      });

      ((serials ?? []) as any[]).forEach((s) => {
        if (!s.location_id) return;
        if (s.estado === 'sin_serial') {
          const key = `sinserial:${s.id}`;
          bucket(s.location_id).set(key, {
            key,
            product_id: s.product_id,
            nombre: s.products?.nombre ?? 'Producto',
            sku: s.products?.sku ?? '',
            disponible: 0,
            reservado: 0,
            total: 1,
            sinSerial: true,
            serialId: s.id,
            serialNumber: s.serial_number,
          });
          return;
        }
        const row = ensure(s.location_id, s.product_id, s.products?.nombre ?? 'Producto', s.products?.sku ?? '');
        row.total += 1;
        if (s.estado === 'reservado') row.reservado += 1;
        if (s.estado === 'disponible') row.disponible += 1;
      });

      const result = new Map<string, ProductRow[]>();
      rowsByBodega.forEach((v, k) => {
        result.set(
          k,
          Array.from(v.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
      });

      return { bodegas: (locations ?? []) as Bodega[], rowsByBodega: result };
    },
  });
}

export default function BodegasPage() {
  const { data, isLoading } = useBodegasStock();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [serialEditing, setSerialEditing] = useState<{ id: string; placeholder: string } | null>(null);

  const summary = useMemo(() => {
    const map = new Map<string, { productos: number; unidades: number }>();
    data?.rowsByBodega.forEach((rows, id) => {
      map.set(id, {
        productos: rows.length,
        unidades: rows.reduce((acc, r) => acc + r.total, 0),
      });
    });
    return map;
  }, [data]);

  return (
    <PageContainer>
      <PageHeader title="Bodegas" description="Stock disponible en cada bodega" />

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Cargando bodegas...</p>
      ) : !data?.bodegas.length ? (
        <p className="py-12 text-center text-muted-foreground">No hay bodegas activas.</p>
      ) : (
        <div className="space-y-4">
          {data.bodegas.map((b) => {
            const isOpen = expanded === b.id;
            const rows = data.rowsByBodega.get(b.id) ?? [];
            const s = summary.get(b.id) ?? { productos: 0, unidades: 0 };
            return (
              <Card key={b.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : b.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{b.nombre}</CardTitle>
                        <p className="text-xs text-muted-foreground">{b.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{s.productos} productos</Badge>
                      <Badge variant="outline">{s.unidades} unidades</Badge>
                      <Button variant="ghost" size="icon" aria-label="Ver detalle">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent>
                    {!rows.length ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        Sin stock registrado en esta bodega.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead className="text-right">Disponible</TableHead>
                              <TableHead className="text-right">Reservado</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((r) => (
                              <TableRow key={r.key}>
                                <TableCell className="font-medium">{r.nombre}</TableCell>
                                <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                                <TableCell className="text-right">
                                  {r.sinSerial ? (
                                    <Badge className="border-transparent bg-warning text-warning-foreground">
                                      Sin serie
                                    </Badge>
                                  ) : (
                                    r.disponible
                                  )}
                                </TableCell>
                                <TableCell className="text-right">{r.reservado}</TableCell>
                                <TableCell className="text-right font-semibold">{r.total}</TableCell>
                                <TableCell className="text-right">
                                  {r.sinSerial && r.serialId && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSerialEditing({
                                          id: r.serialId!,
                                          placeholder: r.serialNumber ?? '',
                                        })
                                      }
                                    >
                                      <Hash className="mr-2 h-3.5 w-3.5" />
                                      Asignar serial
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AsignarSerialDialog serialEditing={serialEditing} onClose={() => setSerialEditing(null)} />
    </PageContainer>
  );
}

function AsignarSerialDialog({
  serialEditing,
  onClose,
}: {
  serialEditing: { id: string; placeholder: string } | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [serial, setSerial] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const nuevoSerial = serial.trim().toUpperCase();
    if (!nuevoSerial || !serialEditing) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('product_serials')
        .update({ serial_number: nuevoSerial, estado: 'disponible' } as any)
        .eq('id', serialEditing.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['bodegas-page'] });
      queryClient.invalidateQueries({ queryKey: ['technician-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['product-serials'] });
      toast({ title: 'Serial asignado', description: nuevoSerial });
      setSerial('');
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!serialEditing}
      onOpenChange={(v) => {
        if (!v) {
          setSerial('');
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar serial real</DialogTitle>
          <DialogDescription>
            Reemplaza el registro provisorio {serialEditing?.placeholder} por el número de serie real.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Número de serie *</Label>
          <Input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="SN-000123"
            className="font-mono"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!serial.trim() || saving}>
            {saving ? 'Guardando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
