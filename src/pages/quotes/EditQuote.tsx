import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Package, Trash2, Loader2 } from 'lucide-react';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { useQuote, useUpdateQuote, useCreateQuoteItem, useDeleteQuoteItem } from '@/hooks/useQuotes';
import { CreateVehicleDialog } from '@/components/quotes/CreateVehicleDialog';
import { ItemSelector } from '@/components/quotes/ItemSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteItemForm {
  id?: string;
  item_tipo: 'producto' | 'servicio';
  ref_id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  subtotal: number;
}

export default function EditQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: quote, isLoading } = useQuote(id!);
  const { data: vehicles } = useVehiclesByClient(quote?.client_id || '');
  const updateQuote = useUpdateQuote();
  const createQuoteItem = useCreateQuoteItem();
  const deleteQuoteItem = useDeleteQuoteItem();

  const [formData, setFormData] = useState({
    vehicle_id: '',
    validez_dias: 30,
    notas: '',
  });

  const [items, setItems] = useState<QuoteItemForm[]>([]);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);

  useEffect(() => {
    if (quote) {
      setFormData({
        vehicle_id: quote.vehicle_id || '',
        validez_dias: quote.validez_dias,
        notas: quote.notas || '',
      });
      
      if (quote.items) {
        setItems(quote.items.map(item => ({
          id: item.id,
          item_tipo: item.item_tipo as 'producto' | 'servicio',
          ref_id: item.ref_id || undefined,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
          subtotal: item.subtotal,
        })));
      }
    }
  }, [quote]);

  const totals = useMemo(() => {
    const neto = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    return { neto, iva, total };
  }, [items]);

  const calcularSubtotal = (item: QuoteItemForm) => {
    const base = item.cantidad * item.precio_unitario;
    const descuento = base * (item.descuento_porcentaje / 100);
    return Math.round(base - descuento);
  };

  const handleAddItem = async (newItem: {
    tipo: 'producto' | 'servicio';
    ref_id: string;
    nombre: string;
    precio_unitario: number;
  }) => {
    const item: QuoteItemForm = {
      item_tipo: newItem.tipo,
      ref_id: newItem.ref_id,
      nombre: newItem.nombre,
      cantidad: 1,
      precio_unitario: newItem.precio_unitario,
      descuento_porcentaje: 0,
      subtotal: newItem.precio_unitario,
    };
    
    try {
      const createdItem = await createQuoteItem.mutateAsync({
        quote_id: id!,
        item_tipo: item.item_tipo,
        ref_id: item.ref_id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento_porcentaje: item.descuento_porcentaje,
      });
      
      setItems([...items, { ...item, id: createdItem.id }]);
      toast.success('Item agregado');
    } catch (error) {
      toast.error('Error al agregar item');
    }
  };

  const updateItemQuantity = async (index: number, cantidad: number) => {
    if (cantidad <= 0) return;
    const item = items[index];
    const newItems = [...items];
    newItems[index].cantidad = cantidad;
    newItems[index].subtotal = calcularSubtotal(newItems[index]);
    setItems(newItems);

    // Persistir cambio en base de datos
    if (item.id) {
      try {
        const subtotal = calcularSubtotal({ ...item, cantidad });
        await supabase
          .from('quote_items')
          .update({ cantidad, subtotal })
          .eq('id', item.id);
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const updateItemPrice = async (index: number, precio: number) => {
    if (precio < 0) return;
    const item = items[index];
    const newItems = [...items];
    newItems[index].precio_unitario = precio;
    newItems[index].subtotal = calcularSubtotal(newItems[index]);
    setItems(newItems);

    // Persistir cambio en base de datos
    if (item.id) {
      try {
        const subtotal = calcularSubtotal({ ...item, precio_unitario: precio });
        await supabase
          .from('quote_items')
          .update({ precio_unitario: precio, subtotal })
          .eq('id', item.id);
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const updateItemDiscount = async (index: number, descuento: number) => {
    const newItems = [...items];
    newItems[index].descuento_porcentaje = Math.min(100, Math.max(0, descuento));
    newItems[index].subtotal = calcularSubtotal(newItems[index]);
    setItems(newItems);

    // Persistir cambio en base de datos
    const item = items[index];
    if (item.id) {
      try {
        const subtotal = calcularSubtotal(newItems[index]);
        await supabase
          .from('quote_items')
          .update({ descuento_porcentaje: newItems[index].descuento_porcentaje, subtotal })
          .eq('id', item.id);
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const removeItem = async (index: number) => {
    const item = items[index];
    if (item.id) {
      try {
        await deleteQuoteItem.mutateAsync({ id: item.id, quote_id: id! });
        setItems(items.filter((_, i) => i !== index));
        toast.success('Item eliminado');
      } catch (error) {
        toast.error('Error al eliminar item');
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateQuote.mutateAsync({
        id: id!,
        vehicle_id: formData.vehicle_id || null,
        validez_dias: formData.validez_dias,
        notas: formData.notas || null,
        neto: totals.neto,
        iva: totals.iva,
        total: totals.total,
      });

      toast.success('Cotización actualizada');
      navigate(`/quotes/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar cotización');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return <div>Cotización no encontrada</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader
        title={`Editar Cotización ${quote.folio}`}
        description="Modifica los datos de la cotización"
        backButton
        backTo={`/quotes/${id}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliente y Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Input value={quote.client?.razon_social || quote.client?.nombre_comercial} disabled />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Vehículo (opcional)</Label>
                  <Select 
                    value={formData.vehicle_id || undefined} 
                    onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un vehículo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.marca} {vehicle.modelo} - {vehicle.patente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowVehicleDialog(true)}
                  className="mt-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button onClick={() => setShowItemSelector(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Sin items"
                  description="Agrega productos o servicios"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Tipo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-24">Cant.</TableHead>
                      <TableHead className="w-32">Precio Unit.</TableHead>
                      <TableHead className="w-24">Desc. %</TableHead>
                      <TableHead className="w-32">Subtotal</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={item.item_tipo === 'producto' ? 'secondary' : 'default'}>
                            {item.item_tipo === 'producto' ? 'Prod' : 'Serv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidad}
                            onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={item.precio_unitario}
                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={item.descuento_porcentaje}
                            onChange={(e) => updateItemDiscount(index, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${item.subtotal.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Neto:</span>
                  <span className="font-medium">${totals.neto.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (19%):</span>
                  <span className="font-medium">${totals.iva.toLocaleString('es-CL')}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totals.total.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Validez (días)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.validez_dias}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    validez_dias: parseInt(e.target.value) || 30 
                  })}
                />
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  rows={4}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full"
                onClick={handleSave}
                disabled={updateQuote.isPending || items.length === 0}
              >
                {updateQuote.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/quotes/${id}`)}
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateVehicleDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        clientId={quote.client_id}
        onVehicleCreated={(vehicleId) => {
          setFormData({ ...formData, vehicle_id: vehicleId });
        }}
      />

      <ItemSelector
        open={showItemSelector}
        onOpenChange={setShowItemSelector}
        onSelectItem={handleAddItem}
      />
    </div>
  );
}
