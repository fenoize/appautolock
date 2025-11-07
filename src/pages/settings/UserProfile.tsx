import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, KeyRound, Mail, Phone, Building2 } from 'lucide-react';
import { RoleBadge } from '@/components/users/RoleBadge';
import { AppRole } from '@/hooks/usePermissions';

export default function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userData, setUserData] = useState({
    id: '',
    email: '',
    nombre: '',
    apellido: '',
    phone: '',
    branch_nombre: '',
    roles: [] as AppRole[]
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          branches:branch_id (nombre)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;

      setUserData({
        id: user.id,
        email: user.email || '',
        nombre: profile?.nombre || '',
        apellido: profile?.apellido || '',
        phone: profile?.phone || '',
        branch_nombre: profile?.branches?.nombre || 'Sin sucursal',
        roles: rolesData?.map(r => r.role as AppRole) || []
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: userData.nombre,
          apellido: userData.apellido,
          phone: userData.phone
        })
        .eq('id', userData.id);

      if (error) throw error;

      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido guardados exitosamente.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Error',
        description: 'Las contraseñas nuevas no coinciden',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente.'
      });

      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (userData.nombre && userData.apellido) {
      return `${userData.nombre[0]}${userData.apellido[0]}`.toUpperCase();
    }
    if (userData.nombre) {
      return userData.nombre.substring(0, 2).toUpperCase();
    }
    return userData.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (userData.nombre) {
      return `${userData.nombre} ${userData.apellido || ''}`.trim();
    }
    return userData.email;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Mi Perfil" />
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Mi Perfil" 
        description="Gestiona tu información personal y configuración de cuenta"
      />

      <div className="grid gap-6">
        {/* Profile Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">{getDisplayName()}</h2>
                <div className="flex flex-wrap gap-2">
                  {userData.roles.map(role => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {userData.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {userData.branch_nombre}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="security">
              <KeyRound className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tus datos personales y de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={userData.nombre}
                      onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
                      placeholder="Ingresa tu nombre"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={userData.apellido}
                      onChange={(e) => setUserData({ ...userData, apellido: e.target.value })}
                      placeholder="Ingresa tu apellido"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no se puede modificar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Requisitos de contraseña:</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Mínimo 6 caracteres</li>
                    <li>Se recomienda incluir mayúsculas, minúsculas y números</li>
                  </ul>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={saving || !passwords.new || !passwords.confirm}
                  >
                    {saving ? 'Actualizando...' : 'Cambiar contraseña'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setPasswords({ current: '', new: '', confirm: '' })}
                  >
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
