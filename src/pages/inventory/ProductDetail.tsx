import { Link, useParams, useNavigate } from 'react-router-dom';
import { useProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useStockMoves } from '@/hooks/useStockMoves';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SubscriptionPlanSelector } from '@/components/shared/SubscriptionPlanSelector';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);
  const updateProduct = useUpdateProduct();
  const { data: moves } = useStockMoves({ product_id: id });

  // Stock por ubicación
  const { data: stockByLocation } = useQuery({
    queryKey: ['product-stock-by-location', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_by_location')
        .select('*')
        .eq('product_id', id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Números de serie
  const { data: serials } = useQuery({
    queryKey: ['product-serials', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_serials')
        .select('id, serial_number, estado, location_id, updated_at, stock_locations(nombre, tipo)')
        .eq('product_id', id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id && product?.serializable,
  });


  const [requiereSuscripcion, setRequiereSuscripcion] = useState(false);
  const [planesSeleccionados, setPlanesSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setRequiereSuscripcion(product.requiere_suscripcion || false);
      setPlanesSeleccionados(
        Array.isArray(product.tipos_suscripcion_disponibles) 
          ? product.tipos_suscripcion_disponibles 
          : []
      );
    }
  }, [product]);

  const handleUpdateSuscripcion = async (requiere: boolean, planes: string[]) => {
    if (id) {
      await updateProduct.mutateAsync({
        id,
        requiere_suscripcion: requiere,
        tipos_suscripcion_disponibles: planes as any
      });
    }
  };

  const handleToggleRequiereSuscripcion = (value: boolean) => {
    setRequiereSuscripcion(value);
    if (!value) {
      setPlanesSeleccionados([]);
      handleUpdateSuscripcion(false, []);
    } else {
      handleUpdateSuscripcion(value, planesSeleccionados);
    }
  };

  const handleSelectPlanes = (planes: string[]) => {
    setPlanesSeleccionados(planes);
    handleUpdateSuscripcion(requiereSuscripcion, planes);
  };

  if (isLoading) return <div>Cargando...</div>;
  if (!product) return <div>Producto no encontrado</div>;

  return (
    <PageContainer>
      <PageHeader
        title={product.nombre}
        description={`SKU: ${product.sku}`}
        action={
          <div className="flex gap-2 items-center">
            {product.serializable && <Badge variant="outline">Serializable</Badge>}
            {product.activo ? (
              <Badge className="bg-green-500">Activo</Badge>
            ) : (
              <Badge variant="destructive">Inactivo</Badge>
            )}
            <Button variant="outline" onClick={() => navigate('/inventory')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button onClick={() => navigate(`/inventory/products/${product.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información General</TabsTrigger>
          <TabsTrigger value="stock">Stock por Ubicación</TabsTrigger>
          <TabsTrigger value="kardex">Kardex</TabsTrigger>
          {product.serializable && <TabsTrigger value="serials">Números de Serie</TabsTrigger>}
          <TabsTrigger value="suscripciones">Suscripciones</TabsTrigger>
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
              {!stockByLocation || stockByLocation.length === 0 ? (
                <p className="text-muted-foreground">Sin stock registrado en ninguna ubicación.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Stock actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockByLocation.map((row: any) => (
                      <TableRow key={row.location_id}>
                        <TableCell className="font-medium">{row.location_nombre ?? row.location_id}</TableCell>
                        <TableCell className="capitalize text-muted-foreground text-sm">{row.location_tipo ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={Number(row.stock_actual) > 0 ? 'default' : 'secondary'}>
                            {Number(row.stock_actual)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kardex">
          <Card>
            <CardHeader>
              <CardTitle>Kardex - Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {!moves || moves.length === 0 ? (
                <p className="text-muted-foreground">Sin movimientos registrados.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Origen → Destino</TableHead>
                      <TableHead>OT</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moves.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{format(new Date(m.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                        <TableCell>{m.cantidad}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.from_location?.nombre || '—'} → {m.to_location?.nombre || '—'}
                        </TableCell>
                        <TableCell>
                          {m.wo_id && m.wo ? (
                            <Link
                              to={`/work-orders/${m.wo_id}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {m.wo.folio}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{m.referencia || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {product.serializable && (
          <TabsContent value="serials">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Números de Serie</CardTitle>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {(['disponible', 'reservado', 'vendido', 'defectuoso'] as const).map((estado) => {
                      const count = (serials ?? []).filter((s: any) => s.estado === estado).length;
                      if (count === 0) return null;
                      const colors: Record<string, string> = {
                        disponible: 'bg-green-500/10 text-green-700 border-green-500/30',
                        reservado: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
                        vendido: 'bg-muted text-muted-foreground',
                        defectuoso: 'bg-red-500/10 text-red-700 border-red-500/30',
                      };
                      return (
                        <Badge key={estado} variant="outline" className={colors[estado]}>
                          {count} {estado}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!serials || serials.length === 0 ? (
                  <p className="text-muted-foreground">No hay números de serie registrados para este producto.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Última actualización</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(serials as any[]).map((s) => {
                        const estadoColors: Record<string, string> = {
                          disponible: 'bg-green-500/10 text-green-700 border-green-500/30',
                          reservado: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
                          vendido: 'bg-muted text-muted-foreground border-border',
                          defectuoso: 'bg-red-500/10 text-red-700 border-red-500/30',
                        };
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-sm font-medium">{s.serial_number}</TableCell>
                            <TableCell>{s.stock_locations?.nombre ?? '—'}</TableCell>
                            <TableCell className="capitalize text-muted-foreground text-sm">{s.stock_locations?.tipo ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={estadoColors[s.estado] ?? ''}>
                                {s.estado}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {s.updated_at ? format(new Date(s.updated_at), 'dd/MM/yyyy HH:mm') : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="suscripciones">
          <SubscriptionPlanSelector
            requiereSuscripcion={requiereSuscripcion}
            planesSeleccionados={planesSeleccionados}
            onToggleRequiereSuscripcion={handleToggleRequiereSuscripcion}
            onSelectPlanes={handleSelectPlanes}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
