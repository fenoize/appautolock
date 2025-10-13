import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { InventoryFilters } from '@/types/inventory';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { ViewToggle } from '@/components/shared/ViewToggle';
import { ProductsTable } from '@/components/inventory/ProductsTable';
import { Plus, Grid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProductsList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const { data: products, isLoading } = useProducts(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Inventario"
        description="Gestiona tus productos y stock"
        action={
          <Button onClick={() => navigate('/inventory/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        }
      />

      <div className="flex gap-4 items-center">
        <SearchBar
          value={filters.search || ''}
          onChange={(value) => setFilters({ ...filters, search: value })}
          placeholder="Buscar por SKU o nombre..."
        />
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando productos...
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No se encontraron productos</p>
          <Button onClick={() => navigate('/inventory/products/new')}>
            Crear primer producto
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <ProductsTable products={products} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/inventory/products/${product.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  {product.activo ? (
                    <Badge className="bg-green-500">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Precio Venta:</span>
                    <span className="font-semibold">${product.precio_venta.toLocaleString('es-CL')}</span>
                  </div>
                  {product.precio_costo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Precio Costo:</span>
                      <span className="font-semibold">${product.precio_costo.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stock Mínimo:</span>
                    <span>{product.stock_minimo}</span>
                  </div>
                  {product.serializable && (
                    <div className="pt-2">
                      <Badge variant="outline">Serializable</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
