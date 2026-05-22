import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useCompatibilityForVehicle } from '@/hooks/useCompatibility';
import { useProducts } from '@/hooks/useProducts';

interface Props {
  vehicle?: { marca?: string | null; modelo?: string | null; anio?: number | null } | null;
  items: { item_tipo: string; ref_id?: string; nombre: string }[];
}

export function QuoteItemCompatibilityAlerts({ vehicle, items }: Props) {
  const { data: products } = useProducts();
  const gpsIds = useMemo(
    () =>
      new Set(
        (products ?? [])
          .filter((p: any) => (p.tipos_suscripcion_disponibles?.length ?? 0) > 0)
          .map((p: any) => p.id),
      ),
    [products],
  );
  const { data: compats = [] } = useCompatibilityForVehicle(vehicle ?? undefined);
  const byProduct = useMemo(() => {
    const m = new Map<string, (typeof compats)[number]>();
    compats.forEach((c) => m.set(c.product_id, c));
    return m;
  }, [compats]);

  if (!vehicle?.marca || !vehicle?.modelo) return null;

  const rojos: string[] = [];
  const amarillos: { nombre: string; obs?: string | null }[] = [];
  for (const it of items) {
    if (it.item_tipo !== 'producto' || !it.ref_id || !gpsIds.has(it.ref_id)) continue;
    const c = byProduct.get(it.ref_id);
    if (!c) continue;
    if (c.estado === 'rojo') rojos.push(it.nombre);
    else if (c.estado === 'amarillo') amarillos.push({ nombre: it.nombre, obs: c.observaciones });
  }

  if (rojos.length === 0 && amarillos.length === 0) return null;

  return (
    <div className="space-y-2">
      {rojos.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Producto no compatible con el vehículo</AlertTitle>
          <AlertDescription>
            Atención: este producto no sería compatible con el vehículo del cliente — {rojos.join(', ')}.
          </AlertDescription>
        </Alert>
      )}
      {amarillos.map((a, i) => (
        <Alert
          key={i}
          className="border-[#eab308]/40 bg-[#eab308]/10 text-[#854d0e] [&>svg]:text-[#854d0e]"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{a.nombre}: compatibilidad con observaciones</AlertTitle>
          <AlertDescription>{a.obs ?? 'Revisar observaciones del catálogo.'}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
