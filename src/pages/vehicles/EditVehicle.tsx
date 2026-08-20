import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVehicle, useUpdateVehicle } from '@/hooks/useVehicles';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FUEL_TYPES, FuelType, IGNITION_TYPES } from '@/types/vehicles';
import { CatalogVehiclePicker } from '@/components/vehicles/CatalogVehiclePicker';
import { toast } from 'sonner';

const vehicleSchema = z.object({
  patente: z.string().min(1, 'La patente es requerida'),
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  vin: z.string().optional(),
  anio: z.number().optional(),
  combustible: z.string().optional(),
  tipo_encendido: z.enum(IGNITION_TYPES).optional(),
  color: z.string().optional(),
  numero_motor: z.string().optional(),
  odometro: z.number().optional(),
  notas: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function EditVehicle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id!);
  const updateVehicle = useUpdateVehicle();

  

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      patente: '',
      marca: '',
      modelo: '',
      vin: '',
      anio: undefined,
      combustible: '',
      tipo_encendido: 'Desconocido',
      color: '',
      numero_motor: '',
      odometro: undefined,
      notas: '',
    },
  });

  // Cargar datos del vehículo desde el servidor
  useEffect(() => {
    if (vehicle) {
      form.reset({
        patente: vehicle.patente,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        vin: vehicle.vin || '',
        anio: vehicle.anio || undefined,
        combustible: vehicle.combustible || '',
        tipo_encendido: (vehicle.tipo_encendido as any) || 'Desconocido',
        color: vehicle.color || '',
        numero_motor: vehicle.numero_motor || '',
        odometro: vehicle.odometro || undefined,
        notas: vehicle.notas || '',
      });
    }
  }, [vehicle]);


  const onSubmit = async (data: VehicleFormData) => {
    try {
      await updateVehicle.mutateAsync({
        id: id!,
        ...data,
      });
      
      toast.success('Vehículo actualizado exitosamente');
      navigate(`/vehicles/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el vehículo');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Cargando vehículo...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground mb-4">Vehículo no encontrado</p>
        <Button onClick={() => navigate('/vehicles')}>Volver a Vehículos</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <PageHeader
        title="Editar Vehículo"
        description={`Modificar información de ${vehicle.patente}`}
        backButton
        backTo={`/vehicles/${id}`}
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Vehículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patente">Patente *</Label>
                <Input
                  id="patente"
                  {...form.register('patente')}
                  placeholder="ABCD12"
                  className="uppercase"
                />
                {form.formState.errors.patente && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.patente.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  {...form.register('vin')}
                  placeholder="Número de identificación del vehículo"
                />
              </div>
            </div>

            {/* Marca, Modelo y Año desde catálogo */}
            <CatalogVehiclePicker
              value={{
                marca: form.watch('marca') || '',
                modelo: form.watch('modelo') || '',
                anio: form.watch('anio'),
                combustible: form.watch('combustible') || undefined,
                tipo_encendido: form.watch('tipo_encendido') || undefined,
              }}
              onChange={(v) => {
                form.setValue('marca', v.marca, { shouldDirty: true });
                form.setValue('modelo', v.modelo, { shouldDirty: true });
                if (v.anio !== undefined) form.setValue('anio', v.anio, { shouldDirty: true });
                if (v.combustible) form.setValue('combustible', v.combustible, { shouldDirty: true });
                if (v.tipo_encendido && (IGNITION_TYPES as readonly string[]).includes(v.tipo_encendido)) {
                  form.setValue('tipo_encendido', v.tipo_encendido as any, { shouldDirty: true });
                }
              }}
            />
            {(form.formState.errors.marca || form.formState.errors.modelo) && (
              <p className="text-sm text-destructive">Marca y modelo son obligatorios</p>
            )}

            {/* Detalles del Vehículo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="combustible">Combustible</Label>
                <Select
                  value={form.watch('combustible') || undefined}
                  onValueChange={(value) => form.setValue('combustible', value)}
                >
                  <SelectTrigger id="combustible">
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

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  {...form.register('color')}
                  placeholder="Blanco"
                />
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_encendido">Tipo de encendido</Label>
                <Select
                  value={form.watch('tipo_encendido') || 'Desconocido'}
                  onValueChange={(value) => form.setValue('tipo_encendido', value as any)}
                >
                  <SelectTrigger id="tipo_encendido">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IGNITION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Este dato es necesario para verificar la compatibilidad de instalación GPS.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_motor">Número de Motor</Label>
                <Input
                  id="numero_motor"
                  {...form.register('numero_motor')}
                  placeholder="Número de motor"
                />
              </div>

              <div>
                <Label htmlFor="odometro">Odómetro (km)</Label>
                <Input
                  id="odometro"
                  type="number"
                  {...form.register('odometro', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                {...form.register('notas')}
                placeholder="Notas adicionales sobre el vehículo..."
                rows={4}
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/vehicles/${id}`)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateVehicle.isPending}>
                {updateVehicle.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
