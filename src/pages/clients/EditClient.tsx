import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClient, useUpdateClient } from '@/hooks/useClients';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClientType, ClientStatus } from '@/types/clients';
import { validateRUT, formatRutInput, splitRutInput } from '@/lib/rut-validation';
import { toast } from 'sonner';
import { SkeletonCard } from '@/components/shared/SkeletonCard';




export default function EditClient() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id!);
  const updateClient = useUpdateClient();

  const [formData, setFormData] = useState({
    tipo: 'empresa' as ClientType,
    rut: '',
    pasaporte: '',
    razon_social: '',
    giro: '',
    nombre_comercial: '',
    email_principal: '',
    emails: [] as string[],
    telefonos: [] as string[],
    estado: 'prospecto' as ClientStatus,
    notas: ''
  });

  const [emailInput, setEmailInput] = useState('');
  const [telefonoInput, setTelefonoInput] = useState('');

  // Load client data from server
  useEffect(() => {
    if (client) {
      setFormData({
        tipo: client.tipo || 'empresa',
        rut: formatRutInput(`${client.rut || ''}${client.dv || ''}`),
        pasaporte: client.pasaporte || '',
        razon_social: client.razon_social || '',
        giro: client.giro || '',
        nombre_comercial: client.nombre_comercial || '',
        email_principal: client.email_principal || '',
        emails: client.emails || [],
        telefonos: client.telefonos || [],
        estado: client.estado || 'prospecto',
        notas: client.notas || ''
      });
    }
  }, [client]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    const { rut, dv } = splitRutInput(formData.rut);

    if (formData.rut) {
      if (!validateRUT(rut, dv)) {
        toast.error('RUT inválido');
        return;
      }
    }

    if (!formData.rut && !formData.pasaporte) {
      toast.error('Debe ingresar RUT o Pasaporte');
      return;
    }

    try {
      await updateClient.mutateAsync({
        id,
        ...formData,
        rut,
        dv
      });


      toast.success('Cliente actualizado correctamente');
      navigate(`/clients/${id}`);
    } catch (error) {
      toast.error('Error al actualizar el cliente');
    }
  };

  const addEmail = () => {
    if (emailInput.trim() && !formData.emails.includes(emailInput.trim())) {
      setFormData(prev => ({
        ...prev,
        emails: [...prev.emails, emailInput.trim()]
      }));
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter(e => e !== email)
    }));
  };

  const addTelefono = () => {
    if (telefonoInput.trim() && !formData.telefonos.includes(telefonoInput.trim())) {
      setFormData(prev => ({
        ...prev,
        telefonos: [...prev.telefonos, telefonoInput.trim()]
      }));
      setTelefonoInput('');
    }
  };

  const removeTelefono = (telefono: string) => {
    setFormData(prev => ({
      ...prev,
      telefonos: prev.telefonos.filter(t => t !== telefono)
    }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  if (!client) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Cliente no encontrado</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/clients/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Editar Cliente
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Modifica la información del cliente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Cliente *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: ClientType) => 
                    setFormData(prev => ({ ...prev, tipo: value }))
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

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: ClientStatus) => 
                    setFormData(prev => ({ ...prev, estado: value }))
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
            </div>

            {formData.tipo === 'empresa' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={formData.rut}
                    onChange={(e) => setFormData(prev => ({ ...prev, rut: formatRutInput(e.target.value) }))}
                    placeholder="19.974.581-6"
                    maxLength={12}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razón Social *</Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social}
                    onChange={(e) => setFormData(prev => ({ ...prev, razon_social: e.target.value }))}
                    placeholder="Empresa S.A."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="giro">Giro</Label>
                  <Input
                    id="giro"
                    value={formData.giro}
                    onChange={(e) => setFormData(prev => ({ ...prev, giro: e.target.value }))}
                    placeholder="Comercio al por mayor"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pasaporte">Pasaporte</Label>
                <Input
                  id="pasaporte"
                  value={formData.pasaporte}
                  onChange={(e) => setFormData(prev => ({ ...prev, pasaporte: e.target.value }))}
                  placeholder="AB123456"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre_comercial">Nombre Comercial *</Label>
              <Input
                id="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_comercial: e.target.value }))}
                placeholder="Nombre con el que se conoce al cliente"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Información de contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
            <CardDescription>Datos de contacto del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email_principal">Email Principal</Label>
              <Input
                id="email_principal"
                type="email"
                value={formData.email_principal}
                onChange={(e) => setFormData(prev => ({ ...prev, email_principal: e.target.value }))}
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Emails Adicionales</Label>
              <div className="flex gap-2">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  placeholder="Agregar email adicional"
                  type="email"
                />
                <Button type="button" onClick={addEmail} variant="outline">
                  Agregar
                </Button>
              </div>
              {formData.emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.emails.map((email, i) => (
                    <div key={i} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md">
                      <span className="text-sm">{email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(email)}
                        className="h-5 w-5 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Teléfonos</Label>
              <div className="flex gap-2">
                <Input
                  value={telefonoInput}
                  onChange={(e) => setTelefonoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTelefono())}
                  placeholder="Agregar teléfono"
                />
                <Button type="button" onClick={addTelefono} variant="outline">
                  Agregar
                </Button>
              </div>
              {formData.telefonos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.telefonos.map((telefono, i) => (
                    <div key={i} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md">
                      <span className="text-sm">{telefono}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTelefono(telefono)}
                        className="h-5 w-5 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
            <CardDescription>Información adicional sobre el cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas adicionales..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/clients/${id}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updateClient.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateClient.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
