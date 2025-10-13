import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserWithRoles } from '@/types/users';
import { RoleBadge } from './RoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { ChevronRight } from 'lucide-react';

interface UsersTableProps {
  users: UserWithRoles[];
}

export function UsersTable({ users }: UsersTableProps) {
  const navigate = useNavigate();

  const getInitials = (user: UserWithRoles) => {
    if (user.nombre && user.apellido) {
      return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
    }
    if (user.nombre) {
      return user.nombre.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: UserWithRoles) => {
    if (user.nombre) {
      return `${user.nombre} ${user.apellido || ''}`.trim();
    }
    return user.email;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">Sucursal</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{getDisplayName(user)}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {user.branch_nombre || '-'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <RoleBadge key={role} role={role} size="sm" />
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin rol</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <UserStatusBadge active={user.estado} />
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
