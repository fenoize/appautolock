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
  precio_venta: z.number().min(0, "Precio debe ser mayor a 0"),
  precio_costo: z.number().optional(),
  stock_minimo: z.number().min(0, "Stock mínimo debe ser mayor o igual a 0"),
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
      stock_minimo: 0,
      unidad_medida: "UND",
      serializable: false,
      aplica_iva: true,
      activo: true,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        sku: product.sku,
        nombre: product.nombre,
        precio_venta: product.precio_venta,
        precio_costo: product.precio_costo || 0,
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
      await updateProduct.mutateAsync({
        id: id!,
        ...data,
      });
      toast.success("Producto actualizado exitosamente");
      navigate(`/inventory/products/${id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar producto");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center py-12">Cargando...</div>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer>
        <div className="text-center py-12">Producto no encontrado</div>
      </PageContainer>
    );
  }

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
                      <FormControl>
                        <Input {...field} placeholder="Ej: PROD-001" />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} placeholder="Nombre del producto" />
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
                      <FormLabel>Precio Venta *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="precio_costo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Costo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
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
                      <FormControl>
                        <Input {...field} placeholder="UND" />
                      </FormControl>
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
                        <p className="text-sm text-muted-foreground">
                          Producto requiere número de serie único
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
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
                        <p className="text-sm text-muted-foreground">
                          Producto está afecto a IVA (19%)
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
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
                        <p className="text-sm text-muted-foreground">
                          Producto activo y disponible
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
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
