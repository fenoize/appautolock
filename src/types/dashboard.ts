// Tipos para el Dashboard extendido

// Rankings
export interface VendedorRanking {
  vendedor_id: string;
  vendedor: string;
  emitidas: number;
  aceptadas: number;
  tasa_cierre: number; // calculado en UI: aceptadas / emitidas * 100
  monto_aceptado: number;
}

export interface TecnicoRanking {
  tecnico_id: string;
  tecnico: string;
  finalizadas: number;
  tiempo_medio_min: number;
  reprogramadas: number;
}

// SLA de OTs
export interface SLAStats {
  cumplidas: number;
  reprogramadas: number;
  atrasadas: number;
  total: number;
  porcentaje_cumplimiento: number; // calculado en UI
}

// Mapa de OTs
export interface OTMapPin {
  id: string;
  folio: string;
  estado: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  cliente: string;
  direccion?: string;
}

// Top Servicios/Productos
export interface TopItem {
  id: string;
  nombre: string;
  qty_total: number;
  monto_total: number;
}

// Ingreso estimado
export interface IngresoEstimado {
  neto_estimado: number;
  periodo: string;
  fuente: 'cotizaciones' | 'mixto'; // si incluye wo_items o solo quotes
}
