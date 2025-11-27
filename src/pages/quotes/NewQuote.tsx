import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, AlertCircle, Package, Trash2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { useCreateQuote, useCreateQuoteItem } from '@/hooks/useQuotes';
import { CreateClientDialog } from '@/components/quotes/CreateClientDialog';
import { CreateVehicleDialog } from '@/components/quotes/CreateVehicleDialog';
import { ItemSelector } from '@/components/quotes/ItemSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY = 'newQuoteFormData';

interface QuoteItemForm {
  item_tipo: 'producto' | 'servicio';
  ref_id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  subtotal: number;
}

export default function NewQuote() {
  const navigate = useNavigate();
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Datos del formulario con auto-guardado
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          client_id: parsed.client_id || '',
          vehicle_id: parsed.vehicle_id || '',
          branch_id: parsed.branch_id || null,
          validez_dias: parsed.validez_dias || 30,
          notas: parsed.notas || '',
        };
      } catch {
        return {
          client_id: '',
          vehicle_id: '',
          branch_id: null,
          validez_dias: 30,
          notas: '',
        };
      }
    }
    return {
      client_id: '',
      vehicle_id: '',
      branch_id: null,
      validez_dias: 30,
      notas: '',
    };
  });

  // Items de la cotización con auto-guardado
  const [items, setItems] = useState<QuoteItemForm[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.items || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Usuario actual
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Control de dialogs
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);

  // Datos
  const { data: clients } = useClients();
  const { data: vehicles } = useVehiclesByClient(formData.client_id);

  // Mutaciones
  const createQuote = useCreateQuote();
  const createQuoteItem = useCreateQuoteItem();

  // Obtener usuario actual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoadingUser(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, branch_id')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
        
        // Establecer branch_id inmediatamente si no hay uno guardado
        if (profile?.branch_id) {
          setFormData(prev => {
            // Solo actualizar si branch_id es null o vacío
            if (!prev.branch_id) {
              console.log('✅ Estableciendo branch_id desde perfil:', profile.branch_id);
              return { ...prev, branch_id: profile.branch_id };
            }
            return prev;
          });
        }
      }
      setIsLoadingUser(false);
    };

    fetchCurrentUser();
  }, []);

  // Auto-guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, items }));
  }, [formData, items]);

  // Calcular totales
  const totals = useMemo(() => {
    const neto = items.reduce((sum, item) => sum + item.subtotal, 0);
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    
    return { neto, iva, total };
  }, [items]);

  // Funciones para items
  const calcularSubtotal = (item: QuoteItemForm) => {
    const base = item.cantidad * item.precio_unitario;
    const descuento = base * (item.descuento_porcentaje / 100);
    return Math.round(base - descuento);
  };

  const handleAddItem = (newItem: {
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
    setItems([...items, item]);
    toast.success('Item agregado');
  };

  const updateItemQuantity = (index: number, cantidad: number) => {
    if (cantidad <= 0) return;
    const newItems = [...items];
    newItems[index].cantidad = cantidad;
    newItems[index].subtotal = calcularSubtotal(newItems[index]);
    setItems(newItems);
  };

  const updateItemDiscount = (index: number, descuento: number) => {
    const newItems = [...items];
    newItems[index].descuento_porcentaje = Math.min(100, Math.max(0, descuento));
    newItems[index].subtotal = calcularSubtotal(newItems[index]);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Item eliminado');
  };

  // Guardar cotización
  const handleSave = async (estado: 'borrador' | 'enviada') => {
    if (!formData.client_id) {
      toast.error('Debes seleccionar un cliente');
      return;
    }

    if (items.length === 0) {
      toast.error('Debes agregar al menos un item');
      return;
    }

    // Validar que existe branch_id (usar el efectivo)
    const branchId = formData.branch_id || currentUser?.branch_id;
    if (!branchId) {
      toast.error('No se detectó una sucursal asignada. Verifica tu perfil de usuario.');
      return;
    }

    if (estado === 'enviada') {
      const client = clients?.find(c => c.id === formData.client_id);
      if (!client?.email_principal) {
        toast.error('El cliente no tiene email principal configurado');
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const quoteData = {
        client_id: formData.client_id,
        vehicle_id: formData.vehicle_id || null,
        branch_id: branchId,
        vendedor_id: user.id,
        validez_dias: formData.validez_dias,
        estado,
        notas: formData.notas || null,
        neto: totals.neto,
        iva: totals.iva,
        total: totals.total,
      };

      const quote = await createQuote.mutateAsync(quoteData);

      for (const item of items) {
        await createQuoteItem.mutateAsync({
          quote_id: quote.id,
          item_tipo: item.item_tipo,
          ref_id: item.ref_id || undefined,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
        });
      }

      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(STORAGE_KEY);
      toast.success(`Cotización ${estado === 'borrador' ? 'guardada' : 'enviada'} exitosamente`);
      navigate(`/quotes/${quote.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar cotización');
    }
  };

  // Validación mejorada para habilitar botones de guardado
  const effectiveBranchId = formData.branch_id || currentUser?.branch_id;
  const canSave = !isLoadingUser && Boolean(formData.client_id) && items.length > 0 && Boolean(effectiveBranchId);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader
        title="Nueva Cotización"
        description="Crea una nueva cotización para un cliente"
        backButton
        backTo="/quotes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Cliente y Vehículo */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente y Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select Cliente */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Cliente *</Label>
                  <Select 
                    value={formData.client_id || undefined} 
                    onValueChange={(v) => {
                      setFormData({ ...formData, client_id: v, vehicle_id: '' });
                      const client = clients?.find(c => c.id === v);
                      if (client?.branch_id) {
                        setFormData(prev => ({ ...prev, branch_id: client.branch_id }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razon_social || client.nombre_comercial} 
                          {client.rut && ` (RUT: ${client.rut}-${client.dv})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowClientDialog(true)}
                  className="mt-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </Button>
              </div>

              {/* Select Vehículo */}
              {formData.client_id && (
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
                            {vehicle.anio && ` (${vehicle.anio})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowVehicleDialog(true)}
                    className="mt-8"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo
                  </Button>
                </div>
              )}

              {/* Advertencia sin vehículo */}
              {formData.client_id && !formData.vehicle_id && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sin vehículo asignado</AlertTitle>
                  <AlertDescription>
                    No se podrá verificar compatibilidad de productos/servicios. 
                    Puedes continuar sin vehículo y agregarlo después.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Card: Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items de la Cotización</CardTitle>
              <Button 
                onClick={() => setShowItemSelector(true)}
                disabled={!formData.client_id}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Sin items"
                  description="Agrega productos o servicios a la cotización"
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
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
                              {item.item_tipo === 'producto' ? 'Producto' : 'Servicio'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.nombre}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            ${item.precio_unitario.toLocaleString('es-CL')}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - 1/3 */}
        <div className="space-y-6">
          {/* Card: Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Neto:</span>
                  <span className="font-medium">
                    ${totals.neto.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (19%):</span>
                  <span className="font-medium">
                    ${totals.iva.toLocaleString('es-CL')}
                  </span>
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
                  placeholder="Notas adicionales para el cliente..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Acciones */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => handleSave('borrador')}
                disabled={!canSave || createQuote.isPending}
              >
                Guardar Borrador
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleSave('enviada')}
                disabled={!canSave || createQuote.isPending}
              >
                Guardar y Enviar
              </Button>
              <Button 
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/quotes')}
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CreateClientDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        onClientCreated={(clientId) => {
          setFormData({ ...formData, client_id: clientId });
          setShowClientDialog(false);
        }}
        branchId={formData.branch_id}
      />

      <CreateVehicleDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        clientId={formData.client_id}
        onVehicleCreated={(vehicleId) => {
          setFormData({ ...formData, vehicle_id: vehicleId });
          setShowVehicleDialog(false);
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
