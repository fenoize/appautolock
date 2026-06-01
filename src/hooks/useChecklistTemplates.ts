import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChecklistTemplate {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateItem {
  id: string;
  template_id: string;
  titulo: string;
  orden: number;
  obligatorio: boolean;
  created_at: string;
}

export interface ChecklistTemplateWithItems extends ChecklistTemplate {
  checklist_template_items: ChecklistTemplateItem[];
}

export function useChecklistTemplates() {
  return useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates' as any)
        .select('*, checklist_template_items(*)')
        .order('nombre');
      if (error) throw error;
      return (data || []) as unknown as ChecklistTemplateWithItems[];
    },
  });
}

export function useChecklistTemplate(id?: string) {
  return useQuery({
    queryKey: ['checklist-template', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates' as any)
        .select('*, checklist_template_items(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as ChecklistTemplateWithItems;
    },
    enabled: !!id,
  });
}

export function useCreateChecklistTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nombre: string; descripcion?: string; items: { titulo: string; orden: number; obligatorio: boolean }[] }) => {
      const { data: tpl, error } = await supabase
        .from('checklist_templates' as any)
        .insert({ nombre: input.nombre, descripcion: input.descripcion } as any)
        .select()
        .single();
      if (error) throw error;
      const tplId = (tpl as any).id as string;
      if (input.items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('checklist_template_items' as any)
          .insert(input.items.map(i => ({ ...i, template_id: tplId })) as any);
        if (itemsErr) throw itemsErr;
      }
      return tpl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Plantilla creada');
    },
    onError: (e: any) => toast.error(e.message || 'Error al crear plantilla'),
  });
}

export function useUpdateChecklistTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; nombre?: string; descripcion?: string; activa?: boolean }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from('checklist_templates' as any).update(rest as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Plantilla actualizada');
    },
  });
}

export function useDeleteChecklistTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Plantilla eliminada');
    },
  });
}

export function useCreateTemplateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { template_id: string; titulo: string; orden: number; obligatorio: boolean }) => {
      const { error } = await supabase.from('checklist_template_items' as any).insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
}

export function useUpdateTemplateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; titulo?: string; orden?: number; obligatorio?: boolean }) => {
      const { error } = await supabase.from('checklist_template_items' as any).update(rest as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
}

export function useDeleteTemplateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_template_items' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });
}

export function useApplyTemplateToService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ serviceId, templateId, mode }: { serviceId: string; templateId: string; mode: 'replace' | 'append' }) => {
      const { data: items, error } = await supabase
        .from('checklist_template_items' as any)
        .select('*')
        .eq('template_id', templateId)
        .order('orden');
      if (error) throw error;
      const templateItems = (items || []) as unknown as ChecklistTemplateItem[];

      let baseOrden = 0;
      if (mode === 'replace') {
        const { error: delErr } = await supabase
          .from('service_checklist_items')
          .delete()
          .eq('service_id', serviceId);
        if (delErr) throw delErr;
      } else {
        const { data: existing } = await supabase
          .from('service_checklist_items')
          .select('orden')
          .eq('service_id', serviceId)
          .order('orden', { ascending: false })
          .limit(1);
        baseOrden = existing?.[0]?.orden ?? 0;
      }

      if (templateItems.length > 0) {
        const payload = templateItems.map((it, idx) => ({
          service_id: serviceId,
          titulo: it.titulo,
          obligatorio: it.obligatorio,
          orden: baseOrden + idx + 1,
        }));
        const { error: insErr } = await supabase.from('service_checklist_items').insert(payload);
        if (insErr) throw insErr;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['service-checklist-items', vars.serviceId] });
      qc.invalidateQueries({ queryKey: ['service-complete', vars.serviceId] });
      toast.success('Plantilla aplicada');
    },
    onError: (e: any) => toast.error(e.message || 'Error al aplicar plantilla'),
  });
}
