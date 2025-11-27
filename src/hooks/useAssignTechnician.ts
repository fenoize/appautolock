import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ woId, technicianId }: { woId: string; technicianId: string }) => {
      // 1. Obtener OT completa
      const { data: wo, error: fetchError } = await supabase
        .from('work_orders')
        .select(`
          *,
          client:clients(*),
          vehicle:vehicles(*)
        `)
        .eq('id', woId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 2. Asignar técnico
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ tecnico_id: technicianId, estado: 'asignada' })
        .eq('id', woId);
      
      if (updateError) throw updateError;
      
      // 3. Obtener datos del técnico
      const { data: technician, error: techError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', technicianId)
        .single();
      
      if (techError) throw techError;
      
      // 4. Enviar notificación al técnico
      let emailWarning = null;
      try {
        const { data: notifResult, error: notifError } = await supabase.functions.invoke('send-notification', {
          body: {
            evento: 'wo_assigned',
            data: {
              ot: {
                folio: wo.folio,
                fecha_programada: wo.fecha_programada,
                ventana_inicio: wo.ventana_inicio,
                ventana_fin: wo.ventana_fin,
                notas: wo.notas
              },
              cliente: wo.client,
              vehiculo: wo.vehicle,
              tecnico: {
                nombre: technician.nombre,
                apellido: technician.apellido,
                email: technician.email
              },
              sistema: {
                empresa_nombre: 'Autolock',
                fecha_actual: new Date().toISOString()
              }
            },
            recipient: technician.email
          }
        });
        
        if (notifError || notifResult?.warning) {
          emailWarning = notifResult?.warning || 'No se pudo enviar la notificación por email';
        }
      } catch (emailError) {
        console.error('Error sending technician notification:', emailError);
        emailWarning = 'No se pudo enviar la notificación por email';
      }
      
      return { emailWarning };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      
      if (result?.emailWarning) {
        toast.success('Técnico asignado correctamente', {
          description: `⚠️ ${result.emailWarning}. Verifica tu dominio en Resend para enviar emails.`
        });
      } else {
        toast.success('Técnico asignado y notificado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar técnico');
    }
  });
}
