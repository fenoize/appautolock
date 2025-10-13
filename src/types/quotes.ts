import { Client } from './clients';

export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada';

export interface Quote {
  id: string;
  folio: string;
  client_id: string;
  vendedor_id: string;
  branch_id: string;
  fecha_emision: string;
  validez_dias: number;
  estado: QuoteStatus;
  neto: number;
  iva: number;
  total: number;
  notas?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  client?: Client;
  vendedor?: {
    id: string;
    nombre: string;
    apellido?: string;
    email: string;
  };
  branch?: {
    id: string;
    nombre: string;
    codigo: string;
  };
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_tipo: 'servicio' | 'producto';
  ref_id?: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  subtotal: number;
  created_at: string;
}

export interface QuoteFilters {
  search?: string;
  estado?: QuoteStatus;
  vendedor_id?: string;
  branch_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface QuoteStats {
  total_cotizaciones: number;
  tasa_cierre: number;
  ticket_promedio: number;
  por_estado: Record<QuoteStatus, number>;
}
