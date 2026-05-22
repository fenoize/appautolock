import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';
import { useCompatibilityForVehicle } from '@/hooks/useCompatibility';
import { CompatibilityBadge } from '@/components/compatibility/CompatibilityBadge';

interface Props {
  vehicle: { marca?: string | null; modelo?: string | null; anio?: number | null };
}

export function VehicleProductCompatibility({ vehicle }: Props) {
  const { data: products } = useProducts();
  const gpsProducts = useMemo(
    () => (products ?? []).filter((p: any) => (p.tipos_suscripcion_disponibles?.length ?? 0) > 0),
    [products],
  );
  const { data: compats = [], isLoading } = useCompatibilityForVehicle(vehicle);
  const byProduct = useMemo(() => {
    const m = new Map<string, (typeof compats)[number]>();
    compats.forEach((c) => m.set(c.product_id, c));
    return m;
  }, [compats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compatibilidad con productos GPS</CardTitle>
      </CardHeader>
      <CardContent>
        {gpsProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay productos GPS configurados.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gpsProducts.map((p: any) => {
                  const c = byProduct.get(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>
                        <CompatibilityBadge estado={c?.estado} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c?.observaciones ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {isLoading && <p className="text-xs text-muted-foreground mt-2">Cargando…</p>}
      </CardContent>
    </Card>
  );
}
