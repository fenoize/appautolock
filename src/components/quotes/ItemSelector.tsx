import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useActiveSubscriptionPlans } from '@/hooks/useSubscriptionPlansActive';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wrench, Search, Satellite, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: {
    tipo: 'producto' | 'servicio' | 'suscripcion';
    ref_id: string;
    nombre: string;
    precio_unitario: number;
    periodo_meses?: number;
    default_plan?: { id: string; nombre: string; precio: number; periodo_meses: number } | null;
  }) => void;
}

export function ItemSelector({ open, onOpenChange, onSelectItem }: ItemSelectorProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'productos' | 'servicios' | 'planes'>('productos');
  
  const { data: products } = useProducts();
  const { data: services } = useServices();
  const { data: plans } = useActiveSubscriptionPlans();

  const filteredPlans = plans?.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );


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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="productos">
                <Package className="h-4 w-4 mr-2" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="servicios">
                <Wrench className="h-4 w-4 mr-2" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="planes">
                <Repeat className="h-4 w-4 mr-2" />
                Planes
              </TabsTrigger>
            </TabsList>


            <TabsContent value="productos" className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredProducts?.map(product => {
                const hasGps = (product.tipos_suscripcion_disponibles?.length ?? 0) > 0;
                return (
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
                      if (hasGps) {
                        toast.info('Este producto requiere configurar una suscripción GPS al completar la instalación. El plan se asigna luego en la OT.');
                      }
                      onOpenChange(false);
                      setSearch('');
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{product.nombre}</p>
                          {hasGps && (
                            <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
                              <Satellite className="h-3 w-3" />
                              GPS
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="secondary">
                        ${product.precio_venta?.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
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
                      default_plan: (service as any).default_plan ?? null,
                    });
                    onOpenChange(false);
                    setSearch('');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{service.nombre}</p>
                        {(service as any).default_plan && (
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                            Incluye plan
                          </Badge>
                        )}
                      </div>
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

            <TabsContent value="planes" className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredPlans?.map(plan => (
                <div
                  key={plan.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectItem({
                      tipo: 'suscripcion',
                      ref_id: plan.id,
                      nombre: plan.nombre,
                      precio_unitario: Number(plan.precio),
                      periodo_meses: plan.periodo_meses,
                    });
                    onOpenChange(false);
                    setSearch('');
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                        SUB
                      </span>
                      <div>
                        <p className="font-medium">{plan.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Recurrente · {plan.periodo_meses} meses
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      ${Number(plan.precio).toLocaleString('es-CL')}
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredPlans?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No se encontraron planes activos
                </p>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </DialogContent>
    </Dialog>
  );
}
