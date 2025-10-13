import { Client } from './clients';
import { Vehicle } from './vehicles';

export type WOStatus = 
  | 'pendiente' 
  | 'asignada' 
  | 'programada' 
  | 'en_ruta' 
  | 'en_proceso' 
  | 'pausada' 
  | 'reprogramada' 
  | 'completada' 
  | 'cancelada';

export interface WorkOrder {
  id: string;
  folio: string;
  client_id: string;
  vehicle_id?: string;
  branch_id: string;
  tecnico_id?: string;
  estado: WOStatus;
  fecha_programada?: string;
  ventana_inicio?: string;
  ventana_fin?: string;
  direccion_id?: string;
  ubicacion_manual?: string;
  notas?: string;
  checklist_data?: ChecklistData;
  evidencias_urls?: string[];
  firma_url?: string;
  firma_nombre?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  duracion_minutos?: number;
  observaciones_cierre?: string;
  pdf_informe_url?: string;
  quote_id?: string;
  inventario_reservado: boolean;
  inventario_consumido: boolean;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  client?: Client;
  vehicle?: Vehicle;
  tecnico?: {
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
  items?: WOItem[];
  substitutions?: WOSubstitution[];
}

export interface WOItem {
  id: string;
  wo_id: string;
  item_tipo: 'servicio' | 'producto';
  ref_id?: string;
  nombre: string;
  cantidad: number;
  precio_unitario?: number;
  created_at: string;
}

export interface ChecklistData {
  template_id?: string;
  items: ChecklistItem[];
  completed_at?: string;
  completed_by?: string;
}

export interface ChecklistItem {
  id: string;
  texto: string;
  requerido: boolean;
  completado: boolean;
  notas?: string;
}

export interface WOSubstitution {
  id: string;
  wo_id: string;
  producto_original_id: string;
  producto_sustituto_id: string;
  cantidad: number;
  razon?: string;
  autorizado_por?: string;
  created_at: string;
  
  producto_original?: {
    id: string;
    nombre: string;
    sku: string;
  };
  producto_sustituto?: {
    id: string;
    nombre: string;
    sku: string;
  };
}

export interface WOFilters {
  search?: string;
  estado?: WOStatus;
  tecnico_id?: string;
  branch_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface WOStats {
  total_ots: number;
  completadas: number;
  en_proceso: number;
  pendientes: number;
  tiempo_promedio_minutos: number;
  por_estado: Record<WOStatus, number>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    wo: WorkOrder;
  };
}
