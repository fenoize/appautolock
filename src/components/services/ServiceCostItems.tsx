import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";

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

interface MaterialRow {
  id: string;
  cantidad: number;
  precio_costo_snapshot: number | null;
  products: { id: string; nombre: string; precio_costo: number } | null;
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
  precioBaseActual?: number;
}

export function ServiceCostItems({ serviceId, porcentajeUtilidadInicial = 0, precioBaseActual = 0 }: Props) {
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [porcentajeUtilidad, setPorcentajeUtilidad] = useState<number>(porcentajeUtilidadInicial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setPorcentajeUtilidad(porcentajeUtilidadInicial ?? 0);
  }, [porcentajeUtilidadInicial]);

  const loadMaterials = useCallback(async () => {
    const { data } = await supabase
      .from("services_products")
      .select("id, cantidad, precio_costo_snapshot, products(id, nombre, precio_costo)")
      .eq("service_id", serviceId);
    setMaterials((data ?? []) as unknown as MaterialRow[]);
  }, [serviceId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data, error }] = await Promise.all([
        supabase.from("service_cost_items").select("*").eq("service_id", serviceId).order("orden"),
        loadMaterials(),
      ]);
      if (!active) return;
      if (error) toast.error("No se pudieron cargar los costos");
      else setCostItems((data ?? []) as unknown as CostItem[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [serviceId, loadMaterials]);

  const costoItems = costItems.reduce(
    (acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.precio_unitario) || 0),
    0,
  );
  const costoMateriales = materials.reduce(
    (acc, m) => acc + (Number(m.cantidad) || 0) * (Number(m.products?.precio_costo) || 0),
    0,
  );
  const costoTotal = costoItems + costoMateriales;
  const precioVenta = Math.round(costoTotal * (1 + (Number(porcentajeUtilidad) || 0) / 100));

  const staleMaterials = materials.filter(
    (m) =>
      m.precio_costo_snapshot !== null &&
      Number(m.precio_costo_snapshot) !== Number(m.products?.precio_costo ?? 0),
  );

  const costoMaterialesAnterior = materials.reduce(
    (acc, m) =>
      acc +
      (Number(m.cantidad) || 0) *
        (m.precio_costo_snapshot !== null
          ? Number(m.precio_costo_snapshot)
          : Number(m.products?.precio_costo) || 0),
    0,
  );
  const costoAnterior = costoItems + costoMaterialesAnterior;

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

  const doSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("services")
      .update({ precio_base: precioVenta, porcentaje_utilidad: Number(porcentajeUtilidad) || 0 })
      .eq("id", serviceId);

    if (error) {
      setSaving(false);
      toast.error("No se pudo actualizar el precio base");
      return;
    }

    for (const m of materials) {
      await supabase
        .from("services_products")
        .update({ precio_costo_snapshot: Number(m.products?.precio_costo) || 0 })
        .eq("id", m.id);
    }

    await loadMaterials();
    setSaving(false);
    setModalOpen(false);
    toast.success("Precio base actualizado");
  };

  const handleUpdatePrecioBase = () => {
    if (staleMaterials.length > 0) setModalOpen(true);
    else doSave();
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

      {staleMaterials.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
            Algunos materiales cambiaron de precio. Revisa antes de actualizar el precio base.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-400 dark:border-amber-700"
            onClick={() => setModalOpen(true)}
          >
            Ver cambios
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Costos del servicio</span>
            <span className="font-medium">{clp(costoItems)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Materiales requeridos</span>
            <span className="font-medium">{clp(costoMateriales)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar actualización de precio base</DialogTitle>
            <DialogDescription>
              Revisa los cambios de precio de materiales antes de guardar.
            </DialogDescription>
          </DialogHeader>

          {staleMaterials.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Precio anterior</TableHead>
                    <TableHead className="text-right">Precio actual</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staleMaterials.map((m) => {
                    const anterior = Number(m.precio_costo_snapshot) || 0;
                    const actual = Number(m.products?.precio_costo) || 0;
                    const diff = actual - anterior;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>{m.products?.nombre ?? "—"}</TableCell>
                        <TableCell className="text-right">{clp(anterior)}</TableCell>
                        <TableCell className="text-right">{clp(actual)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            diff > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {diff > 0 ? "+" : "-"}
                          {clp(Math.abs(diff))} {diff > 0 ? "↑" : "↓"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-2 rounded-lg border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Costo anterior</span>
              <span>{clp(costoAnterior)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nuevo costo</span>
              <span className="font-medium">{clp(costoTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio base anterior</span>
              <span>{clp(Number(precioBaseActual) || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nuevo precio base</span>
              <span className="font-semibold text-primary">{clp(precioVenta)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={doSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar y guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
