import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

const productSchema = z.object({
  sku: z.string().min(1, "SKU es requerido"),
  nombre: z.string().min(1, "Nombre es requerido"),
  precio_venta: z.number().min(0),
  precio_costo: z.number().min(0).optional(),
  porcentaje_utilidad: z.number().min(0).max(100).default(30),
  costo_neto: z.number().min(0).default(0),
  stock_minimo: z.number().min(0),
  unidad_medida: z.string().default("UND"),
  serializable: z.boolean().default(false),
  aplica_iva: z.boolean().default(true),
  activo: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);
  const updateProduct = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      precio_venta: 0,
      precio_costo: 0,
      porcentaje_utilidad: 30,
      costo_neto: 0,
      stock_minimo: 0,
      unidad_medida: "UND",
      serializable: false,
      aplica_iva: true,
      activo: true,
    },
  });

  const precioCostoValue = form.watch("precio_costo");
  const porcentajeValue = form.watch("porcentaje_utilidad") ?? 30;

  // Calcular precio venta cuando cambia precio_costo o porcentaje_utilidad
  useEffect(() => {
    if (precioCostoValue && porcentajeValue >= 0) {
      const precioVenta = Math.round(precioCostoValue * (1 + porcentajeValue / 100));
      form.setValue("precio_venta", precioVenta);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioCostoValue, porcentajeValue]);

  // Cargar datos del producto existente
  useEffect(() => {
    if (product) {
      const pCosto = product.precio_costo || 0;
      const pVenta = product.precio_venta || 0;
      const utilidad = pCosto > 0 ? Math.round(((pVenta - pCosto) / pCosto) * 100) : 30;

      form.reset({
        sku: product.sku,
        nombre: product.nombre,
        precio_venta: pVenta,
        precio_costo: pCosto,
        porcentaje_utilidad: Math.min(Math.max(utilidad, 0), 100),
        costo_neto: (product as any).costo_neto || 0,
        stock_minimo: product.stock_minimo,
        unidad_medida: product.unidad_medida,
        serializable: product.serializable,
        aplica_iva: product.aplica_iva,
        activo: product.activo,
      });
    }
  }, [product, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      await updateProduct.mutateAsync({ id: id!, ...data } as any);
      toast.success("Producto actualizado exitosamente");
      navigate(`/inventory/products/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar producto");
    }
  };

  if (isLoading) return <PageContainer><div className="text-center py-12">Cargando...</div></PageContainer>;
  if (!product) return <PageContainer><div className="text-center py-12">Producto no encontrado</div></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        title="Editar Producto"
        description={`Editando: ${product.nombre}`}
        action={
          <Button variant="outline" onClick={() => navigate(`/inventory/products/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl><Input {...field} placeholder="Ej: PROD-001" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl><Input {...field} placeholder="Nombre del producto" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bloque de precios */}
                <div className="col-span-1 md:col-span-2 border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Precio y Utilidad</p>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="precio_costo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio Compra</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="porcentaje_utilidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilidad %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="precio_venta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio Venta</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {precioCostoValue && porcentajeValue ? (
                    <p className="text-xs text-muted-foreground">
                      Margen: ${Math.round((form.watch("precio_venta") || 0) - precioCostoValue).toLocaleString("es-CL")} sobre el costo
                    </p>
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name="costo_neto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo Neto (sin IVA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unidad_medida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad de Medida</FormLabel>
                      <FormControl><Input {...field} placeholder="UND" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="serializable"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Serializable</FormLabel>
                        <p className="text-sm text-muted-foreground">Producto requiere número de serie único</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aplica_iva"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Aplica IVA</FormLabel>
                        <p className="text-sm text-muted-foreground">Producto está afecto a IVA (19%)</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Estado</FormLabel>
                        <p className="text-sm text-muted-foreground">Producto activo y disponible</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(`/inventory/products/${id}`)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
