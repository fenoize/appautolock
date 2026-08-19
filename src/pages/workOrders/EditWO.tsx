import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { useClients } from '@/hooks/useClients';
import { useVehiclesByClient } from '@/hooks/useVehicles';
import { useBranches } from '@/hooks/useBranches';
import { useClientAddresses } from '@/hooks/useClientAddresses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { ComunaRegionFields } from '@/components/shared/ComunaRegionFields';

export default function EditWO() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wo, isLoading } = useWorkOrder(id!);
  const { data: clients } = useClients();
  const { data: branches } = useBranches();
  const updateWO = useUpdateWorkOrder();

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
    region: ''
  });

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
        region: wo.region || ''
      });
    }
  }, [wo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error('Debe seleccionar un cliente');
      return;
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
        region: formData.region || null
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

  if (isLoading) {
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
                  value={formData.client_id} 
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
                  value={formData.vehicle_id} 
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
                  value={formData.branch_id} 
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
