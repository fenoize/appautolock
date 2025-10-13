export interface Service {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  tiempo_estimado_minutos?: number;
  requiere_checklist: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceProduct {
  id: string;
  service_id: string;
  product_id: string;
  cantidad: number;
  created_at: string;
  product?: {
    id: string;
    nombre: string;
    sku: string;
    precio_venta: number;
  };
}

export interface ServiceWithProducts extends Service {
  services_products?: ServiceProduct[];
}
