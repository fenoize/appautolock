export type CombustibleType = 
  | 'bencina'
  | 'diesel'
  | 'electrico'
  | 'hibrido'
  | 'cualquiera';

export interface Service {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  tiempo_estimado_minutos: number;
  requiere_checklist: boolean;
  activo: boolean;
  branch_id?: string;
  version: number;
  solo_cotizable_externo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceProduct {
  id: string;
  service_id: string;
  product_id: string;
  cantidad: number;
  es_sustituible: boolean;
  created_at: string;
  product?: {
    id: string;
    nombre: string;
    sku: string;
    precio_venta: number;
    serializable: boolean;
  };
}

export interface ServiceChecklistItem {
  id: string;
  service_id: string;
  orden: number;
  titulo: string;
  obligatorio: boolean;
  created_at: string;
}

export interface ServiceCompatRule {
  id: string;
  service_id: string;
  combustible: CombustibleType;
  anio_min?: number;
  anio_max?: number;
  nota?: string;
  created_at: string;
}

export interface ServiceUsageStats {
  service_id: string;
  ots_periodo: number;
  tiempo_promedio_real_min: number;
  reprogramadas: number;
  ftf_pct: number;
}

export interface ServiceComplete extends Service {
  services_products?: ServiceProduct[];
  service_checklist_items?: ServiceChecklistItem[];
  service_compat_rules?: ServiceCompatRule[];
  usage_stats?: ServiceUsageStats;
  branch?: {
    id: string;
    nombre: string;
  };
}

export interface ServiceWithProducts extends Service {
  services_products?: ServiceProduct[];
}

export interface ServiceFilters {
  search?: string;
  activo?: boolean;
  branch_id?: string;
  solo_cotizable_externo?: boolean;
}
