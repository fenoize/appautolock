import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { useCreateClient } from '@/hooks/useClients';
import { ClientType, ClientStatus } from '@/types/clients';
import { validateRUT } from '@/lib/rut-validation';
import { toast } from 'sonner';

const formatRut = (raw: string) => {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
};

const formatRutBody = (raw: string) => {
  const clean = raw.replace(/[^0-9]/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const STORAGE_KEY = 'newClientFormData';

export default function NewClient() {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          tipo: 'empresa' as ClientType,
          rut: '',
          dv: '',
          pasaporte: '',
          razon_social: '',
          giro: '',
          nombre_comercial: '',
          email_principal: '',
          telefonos: [''],
          estado: 'prospecto' as ClientStatus,
          notas: ''
        };
      }
    }
    return {
      tipo: 'empresa' as ClientType,
      rut: '',
      dv: '',
      pasaporte: '',
      razon_social: '',
      giro: '',
      nombre_comercial: '',
      email_principal: '',
      telefonos: [''],
      estado: 'prospecto' as ClientStatus,
      notas: ''
    };
  });

  // Auto-guardar en localStorage cuando cambia el formulario
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar RUT si se proporciona
    if (formData.rut && formData.dv) {
      if (!validateRUT(formData.rut, formData.dv)) {
        toast.error('RUT inválido');
        return;
      }
    }

    // Validar que tenga RUT o pasaporte
    if (!formData.rut && !formData.pasaporte) {
      toast.error('Debe ingresar RUT o Pasaporte');
      return;
    }

    try {
      const result = await createClient.mutateAsync({
        ...formData,
        telefonos: formData.telefonos.filter(t => t.trim() !== '')
      });
      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(STORAGE_KEY);
      navigate(`/clients/${result.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRutChange = (value: string) => {
    setFormData({ ...formData, rut: formatRutBody(value) });
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Nuevo Cliente"
        backButton={true}
        backTo="/clients"
      />

      <Card>
          <CardHeader>
            <CardTitle>Nuevo Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Cliente */}
              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: ClientType) => 
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="persona">Persona</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RUT o Pasaporte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RUT</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.rut}
                      onChange={(e) => handleRutChange(e.target.value)}
                      placeholder="12345678"
                      maxLength={10}
                      className="flex-1"
                    />
                    <Input
                      value={formData.dv}
                      onChange={(e) => setFormData({ ...formData, dv: e.target.value.toUpperCase() })}
                      placeholder="K"
                      maxLength={1}
                      className="w-16"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pasaporte (alternativo)</Label>
                  <Input
                    value={formData.pasaporte}
                    onChange={(e) => setFormData({ ...formData, pasaporte: e.target.value })}
                    placeholder="AB123456"
                  />
                </div>
              </div>

              {/* Campos según tipo */}
              {formData.tipo === 'empresa' ? (
                <>
                  <div className="space-y-2">
                    <Label>Razón Social *</Label>
                    <Input
                      required
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giro</Label>
                    <Input
                      value={formData.giro}
                      onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Nombre Completo *</Label>
                  <Input
                    required
                    value={formData.nombre_comercial}
                    onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                  />
                </div>
              )}

              {/* Email y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Principal</Label>
                  <Input
                    type="email"
                    value={formData.email_principal}
                    onChange={(e) => setFormData({ ...formData, email_principal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.telefonos[0]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      telefonos: [e.target.value] 
                    })}
                    placeholder="+56912345678"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: ClientStatus) => 
                    setFormData({ ...formData, estado: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecto">Prospecto</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="mora">Mora</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
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
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending ? 'Guardando...' : 'Guardar Cliente'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/clients')}
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
