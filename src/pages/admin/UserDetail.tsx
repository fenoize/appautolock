import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDetail, useUpdateUser, useUpdateUserRoles, useToggleUserStatus, useResetUserPassword, useDeleteUser } from '@/hooks/useUsers';
import { useBranches } from '@/hooks/useBranches';
import { RoleBadge } from '@/components/users/RoleBadge';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { ResetPasswordDialog } from '@/components/users/ResetPasswordDialog';
import { AppRole } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { KeyRound } from 'lucide-react';

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Acceso completo al sistema. Puede gestionar usuarios, configuración y todos los módulos.',
  operador: 'Puede gestionar clientes, órdenes de trabajo e inventario de su sucursal.',
  tecnico: 'Puede ejecutar órdenes de trabajo y consumir inventario de su camioneta.',
  vendedor: 'Puede gestionar clientes, cotizaciones y suscripciones.',
  cliente: 'Acceso limitado para ver sus propios datos.'
};

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: user, isLoading } = useUserDetail(id!);
  const { data: branches } = useBranches();
  const updateUser = useUpdateUser();
  const updateRoles = useUpdateUserRoles();
  const toggleStatus = useToggleUserStatus();
  const resetPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    phone: '',
    branch_id: ''
  });

  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  // Initialize form data when user loads
  useState(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        phone: user.phone || '',
        branch_id: user.branch_id || ''
      });
      setSelectedRoles(user.roles);
      setIsGlobalAdmin(!user.branch_id && user.roles.includes('admin'));
    }
  });

  const handleSaveInfo = () => {
    if (!id) return;
    const dataToUpdate = {
      ...formData,
      branch_id: isGlobalAdmin || !formData.branch_id ? null : formData.branch_id
    };
    updateUser.mutate({ userId: id, data: dataToUpdate });
  };

  const handleResetPassword = (password: string) => {
    if (!id) return;
    resetPassword.mutate(
      { userId: id, password },
      {
        onSuccess: () => {
          setPasswordDialogOpen(false);
        }
      }
    );
  };

  const handleGlobalAdminToggle = (checked: boolean) => {
    setIsGlobalAdmin(checked);
    if (checked) {
      setFormData({ ...formData, branch_id: '' });
    }
  };

  const handleRoleToggle = (role: AppRole, checked: boolean) => {
    const newRoles = checked
      ? [...selectedRoles, role]
      : selectedRoles.filter(r => r !== role);
    
    setSelectedRoles(newRoles);
    if (id) {
      updateRoles.mutate({ userId: id, roles: newRoles });
    }
  };

  const handleToggleStatus = () => {
    if (!id || !user) return;
    const newEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
    toggleStatus.mutate({ userId: id, estado: newEstado });
  };

  const handleDeleteUser = () => {
    if (!id || !user) return;
    deleteUser.mutate(id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        navigate('/admin/users');
      }
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Cargando..." backButton backTo="/admin/users" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Usuario no encontrado" backButton backTo="/admin/users" />
      </PageContainer>
    );
  }

  const displayName = user.nombre 
    ? `${user.nombre} ${user.apellido || ''}`.trim() 
    : user.email;

  return (
    <PageContainer>
      <PageHeader
        title={displayName}
        description={user.email}
        backButton
        backTo="/admin/users"
      />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Actualiza los datos del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Sucursal</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="global-admin"
                        checked={isGlobalAdmin}
                        onCheckedChange={handleGlobalAdminToggle}
                      />
                      <Label htmlFor="global-admin" className="cursor-pointer">
                        Administrador global (todas las sucursales)
                      </Label>
                    </div>
                    <Select 
                      value={formData.branch_id || undefined} 
                      onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                      disabled={isGlobalAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isGlobalAdmin ? "Todas las sucursales" : "Seleccionar sucursal"} />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={user.estado} onValueChange={(value) => toggleStatus.mutate({ userId: id!, estado: value as 'activo' | 'inactivo' | 'invitado' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="invitado">Invitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 flex-wrap">
                <Button onClick={handleSaveInfo} disabled={updateUser.isPending}>
                  Guardar cambios
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </Button>
                <Button variant="ghost" onClick={() => navigate('/admin/users')}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="ml-auto"
                >
                  Eliminar usuario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles y Permisos</CardTitle>
              <CardDescription>
                Los cambios se guardan automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(['admin', 'operador', 'tecnico', 'vendedor', 'cliente'] as AppRole[]).map((role) => (
                <div key={role} className="flex items-start space-x-3 border-b pb-4 last:border-0">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor={role}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <RoleBadge role={role} />
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
              <CardDescription>
                Historial de actividad del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fecha de creación</Label>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(user.created_at), 'PPP', { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Última modificación</Label>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(user.updated_at), 'PPP', { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={displayName}
        onConfirm={handleDeleteUser}
      />

      <ResetPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        userName={displayName}
        onConfirm={handleResetPassword}
        isLoading={resetPassword.isPending}
      />
    </PageContainer>
  );
}
