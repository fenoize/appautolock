import { Client } from './clients';

export type QuoteStatus = 'borrador' | 'enviada' | 'en_revision' | 'aceptada' | 'rechazada' | 'expirada' | 'convertida_ot' | 'cancelada';

export interface Quote {
  id: string;
  folio: string;
  client_id: string;
  vehicle_id?: string;
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
  comprobante_pago_url?: string;
  metodo_aprobacion?: 'email' | 'manual';
  created_at: string;
  updated_at: string;
  
  // Relaciones
  client?: Client;
  vehicle?: {
    id: string;
    marca: string;
    modelo: string;
    patente: string;
    anio?: number;
  };
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
