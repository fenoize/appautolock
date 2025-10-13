import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/SkeletonTable';
import { UsersTable } from '@/components/users/UsersTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { UserPlus, Users } from 'lucide-react';
import { AppRole } from '@/hooks/usePermissions';

export default function UsersList() {
  const navigate = useNavigate();
  const { data: users, isLoading, error } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.nombre?.toLowerCase().includes(searchLower) ||
        user.apellido?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Role filter
      if (roleFilter !== 'all' && !user.roles.includes(roleFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !user.estado) return false;
      if (statusFilter === 'inactive' && user.estado) return false;

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Usuarios" description="Gestiona los usuarios del sistema" />
        <EmptyState
          icon={Users}
          title="Error al cargar usuarios"
          description={error.message}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema"
        action={
          <Button onClick={() => navigate('/admin/users/new')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invitar Usuario
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre o email..."
            />
            
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AppRole | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <SkeletonTable />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron usuarios"
          description={
            searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay usuarios registrados en el sistema'
          }
          action={
            <Button onClick={() => navigate('/admin/users/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar Usuario
            </Button>
          }
        />
      ) : (
        <UsersTable users={filteredUsers} />
      )}
    </PageContainer>
  );
}
