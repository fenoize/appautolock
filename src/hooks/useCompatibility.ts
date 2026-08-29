import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CompatEstado = "verde" | "amarillo" | "rojo";

export interface VehicleCatalog {
  id: string;
  marca: string;
  modelo: string;
  anio_desde: number | null;
  anio_hasta: number | null;
  tipo_combustible: string | null;
  tipo_encendido: string | null;
  created_at?: string;
}

export interface ProductCompatibility {
  id: string;
  product_id: string;
  vehicle_catalog_id: string;
  estado: CompatEstado;
  observaciones: string | null;
  updated_by: string | null;
  updated_at: string;
}

export const useVehicleCatalog = (search?: string) => {
  return useQuery({
    queryKey: ["vehicle_catalog", search],
    queryFn: async () => {
      let q = (supabase as any)
        .from("vehicle_catalog")
        .select("*")
        .order("marca")
        .order("modelo")
        .limit(5000);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as VehicleCatalog[];
      if (search?.trim()) {
        const s = search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.marca.toLowerCase().includes(s) ||
            r.modelo.toLowerCase().includes(s) ||
            String(r.anio_desde ?? "").includes(s) ||
            String(r.anio_hasta ?? "").includes(s),
        );
      }
      return rows;
    },
  });
};

export const useVehicleMarcas = () => {
  return useQuery({
    queryKey: ["vehicle_marcas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vehicle_catalog")
        .select("marca")
        .order("marca")
        .limit(5000);
      if (error) throw error;
      const set = new Map<string, string>();
      for (const row of (data ?? [])) set.set(row.marca.trim().toLowerCase(), row.marca);
      return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    },
  });
};

export const useVehicleModelos = (marca?: string) => {
  return useQuery({
    queryKey: ["vehicle_modelos", marca],
    enabled: !!marca,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vehicle_catalog")
        .select("modelo")
        .eq("marca", marca)
        .order("modelo");
      if (error) throw error;
      const set = new Map<string, string>();
      for (const row of (data ?? [])) set.set(row.modelo.trim().toLowerCase(), row.modelo);
      return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
    },
  });
};

export const useCreateVehicleCatalog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<VehicleCatalog>) => {
      const { data, error } = await (supabase as any).from("vehicle_catalog").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicle_catalog"] });
      toast.success("Modelo agregado al catálogo");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useProductCompatibility = (productId?: string) => {
  return useQuery({
    queryKey: ["product_compatibility", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_compatibility")
        .select("*")
        .eq("product_id", productId);
      if (error) throw error;
      return (data ?? []) as ProductCompatibility[];
    },
  });
};

export const useUpsertCompatibility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      product_id: string;
      vehicle_catalog_id: string;
      estado: CompatEstado;
      observaciones?: string | null;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;
      const { data, error } = await (supabase as any)
        .from("product_compatibility")
        .upsert(
          {
            product_id: payload.product_id,
            vehicle_catalog_id: payload.vehicle_catalog_id,
            estado: payload.estado,
            observaciones: payload.observaciones ?? null,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "product_id,vehicle_catalog_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_compatibility"] });
      qc.invalidateQueries({ queryKey: ["compatibility_for_vehicle"] });
      toast.success("Compatibilidad actualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

/**
 * Para un vehículo dado (marca/modelo/año), busca todas las compatibilidades
 * de productos en los modelos del catálogo que matchean.
 */
export const useCompatibilityForVehicle = (vehicle?: {
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
}) => {
  return useQuery({
    queryKey: ["compatibility_for_vehicle", vehicle?.marca, vehicle?.modelo, vehicle?.anio],
    enabled: !!vehicle?.marca && !!vehicle?.modelo,
    queryFn: async () => {
      const { data: cats, error: e1 } = await (supabase as any)
        .from("vehicle_catalog")
        .select("*")
        .ilike("marca", vehicle!.marca!)
        .ilike("modelo", vehicle!.modelo!);
      if (e1) throw e1;
      const matching = ((cats ?? []) as VehicleCatalog[]).filter((c) => {
        if (!vehicle!.anio) return true;
        const okDesde = c.anio_desde == null || vehicle!.anio! >= c.anio_desde;
        const okHasta = c.anio_hasta == null || vehicle!.anio! <= c.anio_hasta;
        return okDesde && okHasta;
      });
      if (matching.length === 0) return [] as (ProductCompatibility & { vehicle_catalog: VehicleCatalog })[];
      const ids = matching.map((m) => m.id);
      const { data: comps, error: e2 } = await (supabase as any)
        .from("product_compatibility")
        .select("*")
        .in("vehicle_catalog_id", ids);
      if (e2) throw e2;
      const catById = new Map(matching.map((m) => [m.id, m]));
      return ((comps ?? []) as ProductCompatibility[]).map((c) => ({
        ...c,
        vehicle_catalog: catById.get(c.vehicle_catalog_id)!,
      }));
    },
  });
};
