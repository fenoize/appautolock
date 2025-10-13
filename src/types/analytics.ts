export interface DashboardFilters {
  fecha_desde: string;
  fecha_hasta: string;
  branch_id?: string;
  tecnico_id?: string;
  vendedor_id?: string;
}

export interface TopProductService {
  item_tipo: 'servicio' | 'producto';
  ref_id?: string;
  nombre: string;
  cantidad_total: number;
  ventas_totales: number;
  veces_vendido: number;
}

export interface InventoryRotation {
  product_id: string;
  sku: string;
  nombre: string;
  stock_promedio: number;
  consumos: number;
  rotacion: number;
}

export interface TechnicianProductivity {
  tecnico_id: string;
  nombre_completo: string;
  branch_nombre?: string;
  ots_completadas: number;
  ots_totales: number;
  tiempo_promedio_minutos: number;
  eficiencia: number;
}

export interface QuoteChartData {
  fecha: string;
  creadas: number;
  aceptadas: number;
  rechazadas: number;
}

export interface WOChartData {
  fecha: string;
  completadas: number;
  en_proceso: number;
  pendientes: number;
}

export interface SubscriptionChartData {
  fecha: string;
  activas: number;
  en_mora: number;
  nuevas: number;
}
