import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserWithRoles, UpdateUserData, CreateUserInvitation } from '@/types/users';
import { AppRole } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          branches:branch_id (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const users: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        branch_nombre: profile.branches?.nombre,
        roles: userRoles
          ?.filter(ur => ur.user_id === profile.id)
          ?.map(ur => ur.role as AppRole) || []
      }));

      return users;
    }
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          branches:branch_id (
            nombre
          )
        `)
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const user: UserWithRoles = {
        ...profile,
        branch_nombre: profile.branches?.nombre,
        roles: userRoles?.map(ur => ur.role as AppRole) || []
      };

      return user;
    },
    enabled: !!userId
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: 'Usuario actualizado',
        description: 'Los cambios se guardaron correctamente'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (roles.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(roles.map(role => ({ user_id: userId, role })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: 'Roles actualizados',
        description: 'Los roles del usuario se actualizaron correctamente'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, estado }: { userId: string; estado: 'activo' | 'inactivo' | 'invitado' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ estado })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: `Usuario ${variables.estado}`,
        description: `El estado del usuario se cambió a ${variables.estado}`
          ? 'El usuario puede acceder al sistema nuevamente' 
          : 'El usuario no podrá acceder al sistema'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Contraseña actualizada',
        description: 'La contraseña se cambió correctamente'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invitation: CreateUserInvitation & { password?: string; phone?: string; estado?: string }) => {
      const password = invitation.password || `Temp${Math.random().toString(36).substring(2, 12)}A1!`;

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: invitation.email,
          password,
          nombre: invitation.nombre,
          apellido: invitation.apellido,
          phone: invitation.phone,
          branch_id: invitation.branch_id,
          estado: invitation.estado ?? 'invitado',
          roles: invitation.roles,
        },
      });

      if (error) {
        const ctx = (error as any).context;
        let message = error.message;
        try {
          const body = await ctx?.json?.();
          if (body?.error) message = body.error;
        } catch { /* ignore */ }
        throw new Error(message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuario creado',
        description: 'El usuario ha sido creado exitosamente.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

// Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Call edge function to delete user (requires service role)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado permanentemente del sistema.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
