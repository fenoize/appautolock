import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Tipo = "material" | "mano_de_obra" | "transporte" | "equipo" | "otro";

interface CostItem {
  id: string;
  service_id: string;
  tipo: Tipo;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  orden: number;
}

const TIPO_LABELS: Record<Tipo, string> = {
  material: "Material",
  mano_de_obra: "Mano de Obra",
  transporte: "Transporte",
  equipo: "Equipo",
  otro: "Otro",
};

const TIPO_STYLES: Record<Tipo, string> = {
  material: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  mano_de_obra: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
  transporte: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  equipo: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
  otro: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const clp = (v: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(
    isFinite(v) ? v : 0,
  );

interface Props {
  serviceId: string;
  porcentajeUtilidadInicial?: number;
}

export function ServiceCostItems({ serviceId, porcentajeUtilidadInicial = 0 }: Props) {
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [porcentajeUtilidad, setPorcentajeUtilidad] = useState<number>(porcentajeUtilidadInicial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPorcentajeUtilidad(porcentajeUtilidadInicial ?? 0);
  }, [porcentajeUtilidadInicial]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_cost_items")
        .select("*")
        .eq("service_id", serviceId)
        .order("orden");
      if (!active) return;
      if (error) toast.error("No se pudieron cargar los costos");
      else setCostItems((data ?? []) as unknown as CostItem[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [serviceId]);

  const costoTotal = costItems.reduce(
    (acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0),
    0,
  );
  const precioVenta = Math.round(costoTotal * (1 + (Number(porcentajeUtilidad) || 0) / 100));

  const updateLocal = (id: string, patch: Partial<CostItem>) => {
    setCostItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const persist = async (item: CostItem) => {
    const { error } = await supabase
      .from("service_cost_items")
      .update({
        tipo: item.tipo,
        nombre: item.nombre,
        cantidad: Number(item.cantidad) || 0,
        precio_unitario: Number(item.precio_unitario) || 0,
        orden: item.orden,
      })
      .eq("id", item.id);
    if (error) toast.error("Error al guardar el ítem");
  };

  const handleAdd = async () => {
    const orden = costItems.length ? Math.max(...costItems.map((i) => i.orden)) + 1 : 0;
    const { data, error } = await supabase
      .from("service_cost_items")
      .insert({ service_id: serviceId, tipo: "material", nombre: "", cantidad: 1, precio_unitario: 0, orden })
      .select()
      .single();
    if (error || !data) {
      toast.error("No se pudo agregar el ítem");
      return;
    }
    setCostItems((prev) => [...prev, data as unknown as CostItem]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("service_cost_items").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar el ítem");
      return;
    }
    setCostItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdatePrecioBase = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("services")
      .update({ precio_base: precioVenta, porcentaje_utilidad: Number(porcentajeUtilidad) || 0 })
      .eq("id", serviceId);
    setSaving(false);
    if (error) toast.error("No se pudo actualizar el precio base");
    else toast.success("Precio base actualizado");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Costos del Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Tipo</TableHead>
                    <TableHead className="min-w-[180px]">Nombre</TableHead>
                    <TableHead className="w-28">Cantidad</TableHead>
                    <TableHead className="w-36">Precio Unitario</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Sin costos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    costItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={item.tipo}
                              onValueChange={(v) => {
                                const next = { ...item, tipo: v as Tipo };
                                updateLocal(item.id, { tipo: v as Tipo });
                                persist(next);
                              }}
                            >
                              <SelectTrigger className="h-9 w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(TIPO_LABELS) as Tipo[]).map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {TIPO_LABELS[t]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Badge variant="outline" className={`border-0 ${TIPO_STYLES[item.tipo]}`}>
                              {TIPO_LABELS[item.tipo]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.nombre}
                            placeholder="Nombre del costo"
                            onChange={(e) => updateLocal(item.id, { nombre: e.target.value })}
                            onBlur={() => persist(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={item.cantidad}
                            onChange={(e) => updateLocal(item.id, { cantidad: Number(e.target.value) })}
                            onBlur={() => persist(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={item.precio_unitario}
                            onChange={(e) => updateLocal(item.id, { precio_unitario: Number(e.target.value) })}
                            onBlur={() => persist(item)}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {clp((Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Eliminar ítem"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <Button variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar ítem
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Costo Total</span>
            <span className="text-lg font-semibold">{clp(costoTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">% Utilidad</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step="1"
                className="w-24 text-right"
                value={porcentajeUtilidad}
                onChange={(e) => setPorcentajeUtilidad(Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm font-medium">Precio de Venta</span>
            <span className="text-xl font-bold text-primary">{clp(precioVenta)}</span>
          </div>
          <Button onClick={handleUpdatePrecioBase} disabled={saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Actualizar precio base
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
