import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreateBackup = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('realizar_respaldo_sistema');
      if (error) throw error;
      
      // Guardar JSON en Storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.json`;
      
      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(filename, JSON.stringify(data, null, 2), {
          contentType: 'application/json'
        });
      
      if (uploadError) throw uploadError;
      
      return { filename, data };
    },
    onSuccess: ({ filename }) => {
      toast.success(`Respaldo creado: ${filename}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear respaldo');
    }
  });
};

export const useListBackups = () => {
  return useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('backups')
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      if (error) throw error;
      return data;
    }
  });
};

export const useDownloadBackup = () => {
  return useMutation({
    mutationFn: async (filename: string) => {
      const { data, error } = await supabase.storage
        .from('backups')
        .download(filename);
      if (error) throw error;
      
      // Descargar archivo
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      return filename;
    },
    onSuccess: (filename) => {
      toast.success(`Descargado: ${filename}`);
    }
  });
};
