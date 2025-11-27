import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleBadge } from '@/components/users/RoleBadge';
import { useBranches } from '@/hooks/useBranches';
import { AppRole } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Info } from 'lucide-react';

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Acceso completo al sistema',
  operador: 'Gestión de clientes, OT e inventario',
  tecnico: 'Ejecución de órdenes de trabajo',
  vendedor: 'Gestión de clientes y cotizaciones',
  cliente: 'Acceso limitado a sus datos'
};

export default function InviteUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: branches } = useBranches();

  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    branch_id: ''
  });

  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    setSelectedRoles(prev =>
      checked ? [...prev, role] : prev.filter(r => r !== role)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast({
        title: 'Error',
        description: 'El email es requerido',
        variant: 'destructive'
      });
      return;
    }

    if (selectedRoles.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un rol',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate token
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiraAt = new Date();
      expiraAt.setDate(expiraAt.getDate() + 7); // Expira en 7 días

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create invitation
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          token,
          rol: selectedRoles[0], // Store first role, will assign all on signup
          branch_id: formData.branch_id || null,
          invitado_por: user?.id,
          expira_at: expiraAt.toISOString()
        });

      if (invitationError) throw invitationError;

      // Enviar email de invitación
      const inviteLink = `${window.location.origin}/signup?token=${token}`;
      
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            evento: 'user_invited',
            data: {
              invitation: {
                email: formData.email,
                nombre: formData.nombre || formData.email,
                apellido: formData.apellido || '',
                rol: selectedRoles[0]
              },
              sistema: {
                empresa_nombre: 'Autolock',
                link_registro: inviteLink
              }
            },
            recipient: formData.email
          }
        });
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // No bloquear si falla el email
      }

      toast({
        title: 'Invitación creada',
        description: `Se ha creado la invitación para ${formData.email} y se ha enviado el email con instrucciones.`
      });

      navigate('/admin/users');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Invitar Usuario"
        description="Envía una invitación para crear una cuenta en el sistema"
        backButton
        backTo="/admin/users"
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    placeholder="Pérez"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Sucursal</Label>
                <Select value={formData.branch_id || undefined} onValueChange={(value) => setFormData({ ...formData, branch_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Roles *</Label>
                <div className="space-y-4 border rounded-lg p-4">
                  {(['admin', 'operador', 'tecnico', 'vendedor', 'cliente'] as AppRole[]).map((role) => (
                    <div key={role} className="flex items-start space-x-3">
                      <Checkbox
                        id={`role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                      />
                      <div className="space-y-1 flex-1">
                        <label
                          htmlFor={`role-${role}`}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <RoleBadge role={role} />
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {roleDescriptions[role]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Se creará una invitación que el usuario deberá aceptar mediante su email.
                La invitación expirará en 7 días.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando invitación...' : 'Crear invitación'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/users')}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </PageContainer>
  );
}
