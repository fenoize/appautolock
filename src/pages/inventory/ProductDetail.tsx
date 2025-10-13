import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);

  if (isLoading) return <div>Cargando...</div>;
  if (!product) return <div>Producto no encontrado</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">{product.nombre}</h1>
              <p className="text-muted-foreground">SKU: {product.sku}</p>
            </div>
          </div>
        </div>
        {product.serializable && <Badge>Serializable</Badge>}
        {product.activo ? (
          <Badge className="bg-green-500">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        )}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información General</TabsTrigger>
          <TabsTrigger value="stock">Stock por Ubicación</TabsTrigger>
          <TabsTrigger value="kardex">Kardex</TabsTrigger>
          {product.serializable && <TabsTrigger value="serials">Números de Serie</TabsTrigger>}
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">SKU</h3>
                  <p>{product.sku}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Nombre</h3>
                  <p>{product.nombre}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Precio Venta</h3>
                  <p>${product.precio_venta.toLocaleString()}</p>
                </div>
                {product.precio_costo !== undefined && (
                  <div>
                    <h3 className="font-semibold">Precio Costo</h3>
                    <p>${product.precio_costo.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Stock Mínimo</h3>
                  <p>{product.stock_minimo}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Unidad de Medida</h3>
                  <p>{product.unidad_medida}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Aplica IVA</h3>
                  <p>{product.aplica_iva ? 'Sí' : 'No'}</p>
                </div>
                {product.supplier && (
                  <div>
                    <h3 className="font-semibold">Proveedor</h3>
                    <p>{product.supplier.razon_social}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock por Ubicación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Visualización de stock por ubicación próximamente</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kardex">
          <Card>
            <CardHeader>
              <CardTitle>Kardex - Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Kardex completo próximamente</p>
            </CardContent>
          </Card>
        </TabsContent>

        {product.serializable && (
          <TabsContent value="serials">
            <Card>
              <CardHeader>
                <CardTitle>Números de Serie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Gestión de números de serie próximamente</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
