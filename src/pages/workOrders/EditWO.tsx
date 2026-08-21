import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkOrder, useUpdateWorkOrder, useCreateWOItem, useDeleteWOItem } from '@/hooks/useWorkOrders';
import { useClients } from '@/hooks/useClients';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';
import { useClientAddresses } from '@/hooks/useClientAddresses';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ComunaRegionFields } from '@/components/shared/ComunaRegionFields';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';

export default function EditWO() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wo, isLoading } = useWorkOrder(id!);
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const updateWO = useUpdateWorkOrder();
  const { data: checklistTemplates = [] } = useChecklistTemplates();
  const [checklistTemplateId, setChecklistTemplateId] = useState<string>('');

  const createWOItem = useCreateWOItem();
  const deleteWOItem = useDeleteWOItem();
  const { data: services = [] } = useServices();
  const { data: products = [] } = useProducts();
  const [newItemTipo, setNewItemTipo] = useState<'producto' | 'servicio'>('servicio');
  const [newItemRefId, setNewItemRefId] = useState('');
  const [newItemNombre, setNewItemNombre] = useState('');
  const [newItemCantidad, setNewItemCantidad] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    branch_id: '',
    notas: '',
    fecha_programada: '',
    ventana_inicio: '',
    ventana_fin: '',
    direccion: '',
    comuna: '',
    region: '',
    tipo: 'instalacion',
    original_wo_id: ''
  });
  const [folioInput, setFolioInput] = useState('');
  const [folioResults, setFolioResults] = useState<any[]>([]);
  const [originalWOLabel, setOriginalWOLabel] = useState('');

  const { data: vehicles } = useVehiclesByClient(formData.client_id);
  const { data: clientAddresses } = useClientAddresses(formData.client_id);

  useEffect(() => {
    if (wo) {
      setFormData({
        client_id: wo.client_id || '',
        vehicle_id: wo.vehicle_id || '',
        branch_id: wo.branch_id || '',
        notas: wo.notas || '',
        fecha_programada: wo.fecha_programada ? wo.fecha_programada.slice(0, 16) : '',
        ventana_inicio: wo.ventana_inicio || '',
        ventana_fin: wo.ventana_fin || '',
        direccion: wo.direccion || '',
        comuna: wo.comuna || '',
        region: wo.region || '',
        tipo: (wo as any).tipo || 'instalacion',
        original_wo_id: (wo as any).original_wo_id || ''
      });
      if (wo.checklist_data?.template_id) {
        setChecklistTemplateId(wo.checklist_data.template_id);
      }
    }
  }, [wo]);

  useEffect(() => {
    const origId = (wo as any)?.original_wo_id;
    if (!origId) return;
    (async () => {
      const { data } = await supabase
        .from('work_orders')
        .select('folio')
        .eq('id', origId)
        .maybeSingle();
      if (data?.folio) setOriginalWOLabel(data.folio);
    })();
  }, [wo]);

  const searchOriginalWO = async () => {
    const term = folioInput.trim();
    if (!term) {
      setFolioResults([]);
      return;
    }
    const { data } = await supabase
      .from('work_orders')
      .select('id, folio, clients:client_id(razon_social), vehicles:vehicle_id(patente, marca, modelo)')
      .ilike('folio', `%${term}%`)
      .limit(5);
    setFolioResults((data || []).filter((r: any) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    let newChecklistData: any = wo?.checklist_data ?? null;
    if (checklistTemplateId) {
      const tpl = checklistTemplates.find(t => t.id === checklistTemplateId);
      if (tpl) {
        const sortedItems = [...(tpl.checklist_template_items || [])].sort((a, b) => a.orden - b.orden);
        // Solo rebuildar si la plantilla cambió (o no había checklist_data)
        if (tpl.id !== wo?.checklist_data?.template_id) {
          newChecklistData = {
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
    } else {
      newChecklistData = null;
    }

    updateWO.mutate(
      {
        id: id!,
        client_id: formData.client_id,
        vehicle_id: formData.vehicle_id || null,
        branch_id: formData.branch_id,
        notas: formData.notas || null,
        fecha_programada: formData.fecha_programada || null,
        ventana_inicio: formData.ventana_inicio || null,
        ventana_fin: formData.ventana_fin || null,
        direccion: formData.direccion || null,
        comuna: formData.comuna || null,
        region: formData.region || null,
        tipo: formData.tipo || 'instalacion',
        original_wo_id: formData.original_wo_id || null,
        checklist_data: newChecklistData,
      },
      {
        onSuccess: () => {
          toast.success('Orden de trabajo actualizada');
          navigate(`/work-orders/${id}`);
        },
        onError: (error) => {
          toast.error(`Error al actualizar: ${error.message}`);
        }
      }
    );
  };

  // Load client's default address when client changes
  useEffect(() => {
    if (clientAddresses && clientAddresses.length > 0 && !formData.direccion) {
      const defaultAddress = clientAddresses.find(a => a.es_predeterminada) || clientAddresses[0];
      if (defaultAddress) {
        setFormData(prev => ({
          ...prev,
          direccion: defaultAddress.direccion,
          comuna: defaultAddress.comuna,
          region: defaultAddress.region
        }));
      }
    }
  }, [clientAddresses]);

  if (isLoading || clientsLoading || branchesLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <SkeletonCard />
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="container mx-auto py-6 max-w-4xl text-center">
        <p className="text-muted-foreground mb-4">Orden de trabajo no encontrada</p>
        <Button onClick={() => navigate('/work-orders')}>Volver</Button>
      </div>
    );
  }

  if (wo.estado === 'completada' || wo.estado === 'cancelada') {
    return (
      <div className="container mx-auto py-6 max-w-4xl text-center">
        <p className="text-muted-foreground mb-4">No se puede editar una OT {wo.estado}</p>
        <Button onClick={() => navigate(`/work-orders/${id}`)}>Volver al detalle</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/work-orders/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Editar OT: {wo.folio}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente *</Label>
                <Select 
                  value={formData.client_id || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value, vehicle_id: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.razon_social || client.nombre_comercial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehículo</Label>
                <Select 
                  value={formData.vehicle_id || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.patente} - {vehicle.marca} {vehicle.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_id">Sucursal</Label>
                <Select 
                  value={formData.branch_id || undefined}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección de Instalación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Calle, número, depto, etc."
                />
              </div>
              <ComunaRegionFields
                region={formData.region}
                comuna={formData.comuna}
                onRegionChange={(v) => setFormData(prev => ({ ...prev, region: v, comuna: '' }))}
                onComunaChange={(v) => setFormData(prev => ({ ...prev, comuna: v }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Tipo de OT</Label>
                <Select
                  value={formData.tipo || 'instalacion'}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v, ...(v !== 'garantia' ? { original_wo_id: '' } : {}) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacion">Instalación</SelectItem>
                    <SelectItem value="garantia">Garantía</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === 'garantia' && (
                <div className="space-y-2">
                  <Label>OT Original (referencia)</Label>
                  {formData.original_wo_id ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm bg-muted/40">
                      <span className="truncate font-mono">{originalWOLabel || formData.original_wo_id}</span>
                      {!(wo as any)?.original_wo_id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, original_wo_id: '' }));
                            setOriginalWOLabel('');
                            setFolioInput('');
                          }}
                        >
                          Cambiar
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Folio de la OT original..."
                        value={folioInput}
                        onChange={(e) => setFolioInput(e.target.value)}
                        onBlur={searchOriginalWO}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchOriginalWO();
                          }
                        }}
                      />
                      {folioResults.length > 0 && (
                        <div className="rounded-md border divide-y">
                          {folioResults.map((r: any) => (
                            <button
                              key={r.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, original_wo_id: r.id }));
                                setOriginalWOLabel(r.folio);
                                setFolioResults([]);
                              }}
                            >
                              <span className="font-medium">{r.folio}</span>
                              {r.vehicles?.patente && (
                                <span className="text-muted-foreground"> · {r.vehicles.patente} {r.vehicles.marca} {r.vehicles.modelo}</span>
                              )}
                              {r.clients?.razon_social && (
                                <span className="text-muted-foreground"> · {r.clients.razon_social}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fecha_programada">Fecha y Hora Programada</Label>
                <Input
                  id="fecha_programada"
                  type="datetime-local"
                  value={formData.fecha_programada}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_programada: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ventana_inicio">Ventana Inicio</Label>
                <Input
                  id="ventana_inicio"
                  type="time"
                  value={formData.ventana_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, ventana_inicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ventana_fin">Ventana Fin</Label>
                <Input
                  id="ventana_fin"
                  type="time"
                  value={formData.ventana_fin}
                  onChange={(e) => setFormData(prev => ({ ...prev, ventana_fin: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Instrucciones o notas adicionales..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Trabajos a Realizar</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAddItem(v => !v)}>
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(wo.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin items en esta OT</p>
            ) : (
              <div className="space-y-2">
                {(wo.items ?? []).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={item.item_tipo === 'producto' ? 'default' : 'secondary'} className="shrink-0">
                        {item.item_tipo}
                      </Badge>
                      <span className="text-sm truncate">{item.nombre}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">×{item.cantidad}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={deleteWOItem.isPending}
                        onClick={() => deleteWOItem.mutate({ id: item.id, wo_id: id! })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddItem && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold">Nuevo item</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select
                      value={newItemTipo}
                      onValueChange={(v: 'producto' | 'servicio') => {
                        setNewItemTipo(v);
                        setNewItemRefId('');
                        setNewItemNombre('');
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="producto">Producto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newItemCantidad}
                      onChange={e => setNewItemCantidad(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{newItemTipo === 'servicio' ? 'Servicio' : 'Producto'}</Label>
                  <Select
                    value={newItemRefId || undefined}
                    onValueChange={(v) => {
                      setNewItemRefId(v);
                      if (newItemTipo === 'servicio') {
                        const svc = services.find((s: any) => s.id === v);
                        setNewItemNombre(svc?.nombre || '');
                      } else {
                        const prod = products.find((p: any) => p.id === v);
                        setNewItemNombre(prod?.nombre || '');
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder={`Seleccionar ${newItemTipo}`} /></SelectTrigger>
                    <SelectContent>
                      {newItemTipo === 'servicio'
                        ? services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)
                        : products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddItem(false); setNewItemRefId(''); setNewItemNombre(''); setNewItemCantidad(1); }}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newItemRefId || createWOItem.isPending}
                    onClick={async () => {
                      if (!newItemRefId) return;

                      // Crear wo_item del servicio o producto
                      await createWOItem.mutateAsync({
                        wo_id: id!,
                        item_tipo: newItemTipo,
                        ref_id: newItemRefId,
                        nombre: newItemNombre,
                        cantidad: newItemCantidad,
                      } as any);

                      // Si es servicio, agregar también sus productos como wo_items separados
                      if (newItemTipo === 'servicio') {
                        const svc = services.find((s: any) => s.id === newItemRefId);
                        const svcProducts: any[] = (svc as any)?.services_products || [];
                        for (const sp of svcProducts) {
                          if (sp.product) {
                            await createWOItem.mutateAsync({
                              wo_id: id!,
                              item_tipo: 'producto',
                              ref_id: sp.product_id || sp.product.id,
                              nombre: sp.product.nombre,
                              cantidad: sp.cantidad || 1,
                            } as any);
                          }
                        }
                        if (svcProducts.length > 0) {
                          toast.success(`Servicio agregado con ${svcProducts.length} equipo(s) incluido(s)`);
                        }
                      }

                      setNewItemRefId('');
                      setNewItemNombre('');
                      setNewItemCantidad(1);
                      setShowAddItem(false);
                    }}
                  >
                    {createWOItem.isPending ? 'Agregando...' : 'Agregar item'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/work-orders/${id}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateWO.isPending}>
            {updateWO.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
