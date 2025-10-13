import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateWorkOrder, useCreateWOItem } from '@/hooks/useWorkOrders';
import { useClients } from '@/hooks/useClients';
import { useVehicles } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function NewWO() {
  const navigate = useNavigate();
  const createWO = useCreateWorkOrder();
  const createItem = useCreateWOItem();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState('');
  const { data: vehicles } = useVehicles({ client_id: selectedClient });

  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    branch_id: '',
    notas: '',
    fecha_programada: '',
    ventana_inicio: '',
    ventana_fin: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      alert('Selecciona un cliente');
      return;
    }

    try {
      const wo = await createWO.mutateAsync(formData as any);
      navigate(`/work-orders/${wo.id}`);
    } catch (error) {
      console.error('Error al crear OT:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Nueva Orden de Trabajo</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, client_id: value });
                  setSelectedClient(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.razon_social || client.nombre_comercial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClient && vehicles && vehicles.length > 0 && (
              <div>
                <Label htmlFor="vehicle">Vehículo</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.marca} {vehicle.modelo} - {vehicle.patente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Descripción del trabajo a realizar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha">Fecha Programada</Label>
                <Input
                  id="fecha"
                  type="datetime-local"
                  value={formData.fecha_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="inicio">Ventana Inicio</Label>
                  <Input
                    id="inicio"
                    type="time"
                    value={formData.ventana_inicio}
                    onChange={(e) => setFormData({ ...formData, ventana_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fin">Ventana Fin</Label>
                  <Input
                    id="fin"
                    type="time"
                    value={formData.ventana_fin}
                    onChange={(e) => setFormData({ ...formData, ventana_fin: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/work-orders')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createWO.isPending}>
                {createWO.isPending ? 'Creando...' : 'Crear OT'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
