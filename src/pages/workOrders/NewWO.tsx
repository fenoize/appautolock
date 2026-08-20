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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, AlertCircle, Package, Trash2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { useCreateWorkOrder, useCreateWOItem } from '@/hooks/useWorkOrders';
import { useBranches } from '@/hooks/useBranches';
import { useClientAddresses } from '@/hooks/useClientAddresses';
import { CreateClientDialog } from '@/components/quotes/CreateClientDialog';
import { CreateVehicleDialog } from '@/components/quotes/CreateVehicleDialog';
import { ItemSelector } from '@/components/quotes/ItemSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ComunaRegionFields } from '@/components/shared/ComunaRegionFields';
import { REGIONES, getComunasByRegion } from '@/lib/chile-locations';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';

const STORAGE_KEY = 'newWOFormData';

interface WOItemForm {
  item_tipo: 'producto' | 'servicio';
  ref_id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario?: number;
}

export default function NewWO() {
  const navigate = useNavigate();
  
  // Datos del formulario con auto-guardado
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate region/comuna against our dropdown data — clear if stale free-text values
        const savedRegion = parsed.region || '';
        const validRegion = REGIONES.some(r => r.nombre === savedRegion) ? savedRegion : '';
        const savedComuna = parsed.comuna || '';
        const validComuna = validRegion && getComunasByRegion(validRegion).includes(savedComuna)
          ? savedComuna
          : '';
        return {
          client_id: parsed.client_id || '',
          vehicle_id: parsed.vehicle_id || '',
          branch_id: parsed.branch_id || '',
          fecha_programada: parsed.fecha_programada || '',
          ventana_inicio: parsed.ventana_inicio || '',
          ventana_fin: parsed.ventana_fin || '',
          direccion: parsed.direccion || '',
          comuna: validComuna,
          region: validRegion,
          notas: parsed.notas || '',
        };
      } catch {
        return {
          client_id: '',
          vehicle_id: '',
          branch_id: '',
          fecha_programada: '',
          ventana_inicio: '',
          ventana_fin: '',
          direccion: '',
          comuna: '',
          region: '',
          notas: '',
        };
      }
    }
    return {
      client_id: '',
      vehicle_id: '',
      branch_id: '',
      fecha_programada: '',
      ventana_inicio: '',
      ventana_fin: '',
      direccion: '',
      comuna: '',
      region: '',
      notas: '',
    };
  });

  // Items de la OT con auto-guardado
  const [items, setItems] = useState<WOItemForm[]>(() => {
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
  const { data: branches } = useBranches();
  const { data: clientAddresses } = useClientAddresses(formData.client_id);
  const { data: checklistTemplates = [] } = useChecklistTemplates();
  const [checklistTemplateId, setChecklistTemplateId] = useState<string>('');

  // Mutaciones
  const createWO = useCreateWorkOrder();
  const createWOItem = useCreateWOItem();

  // Obtener usuario actual y establecer branch_id automáticamente
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, branch_id')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
        
        // Establecer branch_id del usuario si no hay uno asignado
        if (profile?.branch_id) {
          setFormData(prev => {
            if (!prev.branch_id) {
              console.log('✅ Estableciendo branch_id desde perfil usuario:', profile.branch_id);
              return { ...prev, branch_id: profile.branch_id };
            }
            return prev;
          });
        }
      }
    };

    fetchCurrentUser();
  }, []);

  // Auto-guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData, items }));
  }, [formData, items]);

  // Cargar dirección predeterminada del cliente cuando se selecciona
  useEffect(() => {
    if (formData.client_id && clientAddresses && clientAddresses.length > 0) {
      // Solo establecer dirección si está vacía
      if (!formData.direccion) {
        const defaultAddress = clientAddresses.find(addr => addr.es_predeterminada) || clientAddresses[0];
        setFormData(prev => ({
          ...prev,
          direccion: defaultAddress.direccion,
          comuna: defaultAddress.comuna,
          region: defaultAddress.region,
        }));
      }
    }
  }, [formData.client_id, clientAddresses]);

  // Funciones para items
  const handleAddItem = (newItem: {
    tipo: 'producto' | 'servicio';
    ref_id: string;
    nombre: string;
    precio_unitario: number;
  }) => {
    const item: WOItemForm = {
      item_tipo: newItem.tipo,
      ref_id: newItem.ref_id,
      nombre: newItem.nombre,
      cantidad: 1,
      precio_unitario: newItem.precio_unitario,
    };
    setItems([...items, item]);
    toast.success('Item agregado');
  };

  const updateItemQuantity = (index: number, cantidad: number) => {
    if (cantidad <= 0) return;
    const newItems = [...items];
    newItems[index].cantidad = cantidad;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Item eliminado');
  };

  // Guardar OT
  const handleSave = async () => {
    if (!formData.client_id) {
      toast.error('Debes seleccionar un cliente');
      return;
    }

    if (items.length === 0) {
      toast.error('Debes agregar al menos un item de trabajo');
      return;
    }

    // Validar que exista branch_id
    const branchId = formData.branch_id || currentUser?.branch_id;
    console.log('💾 Intentando guardar OT con:', {
      client_id: formData.client_id,
      branch_id: branchId,
      formData_branch_id: formData.branch_id,
      currentUser_branch_id: currentUser?.branch_id
    });

    if (!branchId) {
      toast.error('No se puede crear la orden de trabajo sin una sucursal asignada. Por favor, contacta al administrador.');
      return;
    }

    try {
      let checklistData: any = null;
      if (checklistTemplateId) {
        const tpl = checklistTemplates.find(t => t.id === checklistTemplateId);
        if (tpl) {
          const sortedItems = [...(tpl.checklist_template_items || [])].sort((a, b) => a.orden - b.orden);
          checklistData = {
            template_id: tpl.id,
            template_nombre: tpl.nombre,
            items: sortedItems.map(item => ({
              id: item.id,
              texto: item.titulo,
              requerido: item.obligatorio,
              completado: false,
            })),
          };
        }
      }

      const woData = {
        client_id: formData.client_id,
        vehicle_id: formData.vehicle_id || null,
        branch_id: branchId,
        fecha_programada: formData.fecha_programada || null,
        ventana_inicio: formData.ventana_inicio || null,
        ventana_fin: formData.ventana_fin || null,
        direccion: formData.direccion || null,
        comuna: formData.comuna || null,
        region: formData.region || null,
        notas: formData.notas || null,
        checklist_data: checklistData,
        estado: 'pendiente' as const,
      };

      const wo = await createWO.mutateAsync(woData);

      for (const item of items) {
        await createWOItem.mutateAsync({
          wo_id: wo.id,
          item_tipo: item.item_tipo,
          ref_id: item.ref_id || undefined,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        });
      }

      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Orden de trabajo creada exitosamente');
      navigate(`/work-orders/${wo.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear orden de trabajo');
    }
  };

  const canSave = formData.client_id && items.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <PageHeader
        title="Nueva Orden de Trabajo"
        description="Crea una nueva orden de trabajo para un cliente"
        backButton
        backTo="/work-orders"
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
                      const client = clients?.find(c => c.id === v);
                      // Priorizar branch_id del cliente, luego del usuario
                      const branchId = client?.branch_id || formData.branch_id || currentUser?.branch_id;
                      console.log('🔄 Seleccionando cliente:', { 
                        clientBranch: client?.branch_id, 
                        currentFormBranch: formData.branch_id,
                        userBranch: currentUser?.branch_id,
                        finalBranch: branchId 
                      });
                      setFormData({ 
                        ...formData, 
                        client_id: v, 
                        vehicle_id: '',
                        branch_id: branchId 
                      });
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

              {/* Select Sucursal */}
              <div>
                <Label>Sucursal *</Label>
                <Select 
                  value={formData.branch_id || undefined} 
                  onValueChange={(v) => setFormData({ ...formData, branch_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.nombre} ({branch.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Advertencia sin vehículo */}
              {formData.client_id && !formData.vehicle_id && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sin vehículo asignado</AlertTitle>
                  <AlertDescription>
                    Puedes continuar sin vehículo y agregarlo después si es necesario.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Card: Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trabajos a Realizar</CardTitle>
              <Button 
                onClick={() => setShowItemSelector(true)}
                disabled={!formData.client_id}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Trabajo
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Sin trabajos"
                  description="Agrega productos o servicios que se realizarán en esta OT"
                />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="w-24">Cantidad</TableHead>
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
          {/* Card: Programación */}
          <Card>
            <CardHeader>
              <CardTitle>Programación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fecha Programada</Label>
                <Input
                  type="datetime-local"
                  value={formData.fecha_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Ventana Inicio</Label>
                  <Input
                    type="time"
                    value={formData.ventana_inicio}
                    onChange={(e) => setFormData({ ...formData, ventana_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ventana Fin</Label>
                  <Input
                    type="time"
                    value={formData.ventana_fin}
                    onChange={(e) => setFormData({ ...formData, ventana_fin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Checklist (opcional)</Label>
                <Select
                  value={checklistTemplateId || undefined}
                  onValueChange={(v) => setChecklistTemplateId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin checklist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin checklist</SelectItem>
                    {checklistTemplates
                      .filter(t => t.activa)
                      .map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre} ({(t.checklist_template_items || []).length} ítems)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Instrucciones / Notas</Label>
                <Textarea
                  rows={4}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Instrucciones especiales para el técnico..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Dirección de Instalación */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección de Instalación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dirección *</Label>
                <Input
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle, número, depto..."
                />
                {formData.client_id && !formData.direccion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Se usará la dirección predeterminada del cliente
                  </p>
                )}
              </div>

              <ComunaRegionFields
                region={formData.region}
                comuna={formData.comuna}
                onRegionChange={(v) => setFormData({ ...formData, region: v, comuna: '' })}
                onComunaChange={(v) => setFormData({ ...formData, comuna: v })}
              />
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
                onClick={handleSave}
                disabled={!canSave || createWO.isPending}
              >
                Crear Orden de Trabajo
              </Button>
              <Button 
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/work-orders')}
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
