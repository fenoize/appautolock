import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SystemSetting } from "@/types/settings";
import { toast } from "sonner";

export const useSettings = () => {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").order("clave");
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
};

export const useSettingByKey = (clave: string) => {
  return useQuery({
    queryKey: ["setting", clave],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("clave", clave).maybeSingle();
      if (error) throw error;
      return data as SystemSetting | null;
    },
    enabled: !!clave,
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clave, valor }: { clave: string; valor: string }) => {
      const { data, error } = await supabase
        .from("settings")
        .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: "clave" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configuración actualizada");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar configuración");
    },
  });
};

export const useBulkUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const promises = Object.entries(settings).map(([clave, valor]) =>
        supabase
          .from("settings")
          .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: "clave" }),
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configuraciones actualizadas correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar configuraciones");
    },
  });
};
