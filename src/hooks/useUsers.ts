import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserWithRoles, UpdateUserData } from '@/types/users';
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
    mutationFn: async ({ userId, estado }: { userId: string; estado: boolean }) => {
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
        title: variables.estado ? 'Usuario activado' : 'Usuario desactivado',
        description: variables.estado 
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
