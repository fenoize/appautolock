import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCreateVehicle } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { FUEL_TYPES, IGNITION_TYPES } from '@/types/vehicles';
import { toast } from 'sonner';

export default function NewVehicle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createVehicle = useCreateVehicle();
  const { data: clients } = useClients();
  
  const [formData, setFormData] = useState({
    client_id: searchParams.get('client') || '',
    patente: '',
    vin: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    combustible: '',
    tipo_encendido: 'Desconocido' as (typeof IGNITION_TYPES)[number],
    odometro: 0,
    color: '',
    numero_motor: '',
    notas: ''
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear + 1 - i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    if (!formData.patente) {
      toast.error('La patente es obligatoria');
      return;
    }

    try {
      const result = await createVehicle.mutateAsync({
        ...formData,
        patente: formData.patente.toUpperCase()
      });
      navigate(`/vehicles/${result.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Nuevo Vehículo"
        backButton={true}
        backTo="/vehicles"
      />

      <Card>
          <CardHeader>
            <CardTitle>Nuevo Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cliente */}
              <div className="space-y-2">
                <Label>Cliente Propietario *</Label>
                <Select
                  value={formData.client_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.tipo === 'empresa' 
                          ? client.razon_social 
                          : client.nombre_comercial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patente y VIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patente *</Label>
                  <Input
                    required
                    value={formData.patente}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      patente: e.target.value.toUpperCase() 
                    })}
                    placeholder="ABCD12"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>VIN (opcional)</Label>
                  <Input
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    placeholder="1HGBH41JXMN109186"
                  />
                </div>
              </div>

              {/* Marca, Modelo y Año */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input
                    required
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input
                    required
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Corolla"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Select
                    value={formData.anio.toString()}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      anio: parseInt(value) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Combustible y Tipo de encendido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Combustible</Label>
                  <Select
                    value={formData.combustible || undefined}
                    onValueChange={(value) => setFormData({ ...formData, combustible: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((fuel) => (
                        <SelectItem key={fuel} value={fuel}>
                          {fuel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de encendido</Label>
                  <Select
                    value={formData.tipo_encendido}
                    onValueChange={(value) => setFormData({ ...formData, tipo_encendido: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IGNITION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Este dato es necesario para verificar la compatibilidad de instalación GPS.
                  </p>
                </div>
              </div>

              {/* Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Negro"
                  />
                </div>
              </div>

              {/* Odómetro y Número de Motor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Odómetro (km)</Label>
                  <Input
                    type="number"
                    value={formData.odometro}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      odometro: parseInt(e.target.value) || 0 
                    })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Motor (opcional)</Label>
                  <Input
                    value={formData.numero_motor}
                    onChange={(e) => setFormData({ ...formData, numero_motor: e.target.value })}
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <Button type="submit" disabled={createVehicle.isPending}>
                  {createVehicle.isPending ? 'Guardando...' : 'Guardar Vehículo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/vehicles')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </PageContainer>
  );
}
