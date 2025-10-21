import { AppRole } from '@/hooks/usePermissions';

export type UserStatus = 'activo' | 'inactivo' | 'invitado';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  phone?: string;
  branch_id?: string;
  estado: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles extends User {
  branch_nombre?: string;
  roles: AppRole[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface CreateUserInvitation {
  email: string;
  nombre?: string;
  apellido?: string;
  branch_id?: string;
  roles: AppRole[];
}

export interface UpdateUserData {
  nombre?: string;
  apellido?: string;
  phone?: string;
  branch_id?: string;
  estado?: UserStatus;
}
