import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wrench, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: {
    tipo: 'producto' | 'servicio';
    ref_id: string;
    nombre: string;
    precio_unitario: number;
  }) => void;
}

export function ItemSelector({ open, onOpenChange, onSelectItem }: ItemSelectorProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'productos' | 'servicios'>('productos');
  
  const { data: products } = useProducts();
  const { data: services } = useServices();

  const filteredProducts = products?.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const filteredServices = services?.filter(s =>
    s.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Agregar Producto o Servicio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
            />
          </div>

          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="productos">
                <Package className="h-4 w-4 mr-2" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="servicios">
                <Wrench className="h-4 w-4 mr-2" />
                Servicios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="productos" className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredProducts?.map(product => (
                <div
                  key={product.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectItem({
                      tipo: 'producto',
                      ref_id: product.id,
                      nombre: product.nombre,
                      precio_unitario: product.precio_venta || 0,
                    });
                    onOpenChange(false);
                    setSearch('');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{product.nombre}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <Badge variant="secondary">
                      ${product.precio_venta?.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredProducts?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No se encontraron productos
                </p>
              )}
            </TabsContent>

            <TabsContent value="servicios" className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredServices?.map(service => (
                <div
                  key={service.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectItem({
                      tipo: 'servicio',
                      ref_id: service.id,
                      nombre: service.nombre,
                      precio_unitario: service.precio_base,
                    });
                    onOpenChange(false);
                    setSearch('');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{service.nombre}</p>
                      {service.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.descripcion}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      ${service.precio_base?.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredServices?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No se encontraron servicios
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
