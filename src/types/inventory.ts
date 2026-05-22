export type StockMoveType = 'compra' | 'traslado' | 'reserva' | 'consumo' | 'devolucion' | 'ajuste';
export type StockLocationType = 'bodega' | 'camioneta';
export type ProductSerialStatus = 'disponible' | 'reservado' | 'vendido' | 'defectuoso';
export type StockAlertType = 'stock_minimo' | 'sin_stock';

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  tipo?: string;
  descripcion?: string;
  precio_costo?: number;
  precio_venta: number;
  aplica_iva: boolean;
  serializable: boolean;
  stock_minimo: number;
  unidad_medida: string;
  supplier_id?: string;
  activo: boolean;
  requiere_suscripcion?: boolean;
  tipos_suscripcion_disponibles?: string[];
  created_at: string;
  updated_at: string;
  
  supplier?: {
    id: string;
    razon_social: string;
  };
  stock_by_location?: StockByLocation[];
}

export interface StockLocation {
  id: string;
  codigo: string;
  nombre: string;
  tipo: StockLocationType;
  branch_id?: string;
  activa: boolean;
  created_at: string;
  
  branch?: {
    id: string;
    nombre: string;
  };
}

export interface StockMove {
  id: string;
  tipo: StockMoveType;
  product_id: string;
  cantidad: number;
  from_location_id?: string;
  to_location_id?: string;
  referencia?: string;
  notas?: string;
  fecha: string;
  user_id?: string;
  created_at: string;
  wo_id?: string | null;

  product?: Partial<Product> & { id: string; sku?: string; nombre?: string };
  from_location?: Partial<StockLocation> & { id?: string; nombre?: string };
  to_location?: Partial<StockLocation> & { id?: string; nombre?: string };
  user?: {
    id: string;
    nombre: string;
    apellido?: string;
  };
  wo?: { id: string; folio: string } | null;
}

export interface ProductSerial {
  id: string;
  product_id: string;
  serial_number: string;
  location_id?: string;
  estado: ProductSerialStatus;
  notas?: string;
  created_at: string;
  updated_at: string;
  
  product?: Product;
  location?: StockLocation;
}

export interface StockByLocation {
  product_id: string;
  sku: string;
  nombre: string;
  stock_minimo: number;
  location_id: string;
  location_nombre: string;
  location_tipo: StockLocationType;
  branch_id?: string;
  stock_actual: number;
  reservas_activas: number;
}

export interface StockAlert {
  id: string;
  product_id: string;
  location_id: string;
  tipo: StockAlertType;
  stock_actual: number;
  stock_minimo: number;
  resuelta: boolean;
  resuelta_at?: string;
  resuelta_por?: string;
  created_at: string;
  
  product?: Product;
  location?: StockLocation;
}

export interface KardexEntry {
  fecha: string;
  tipo: StockMoveType;
  referencia?: string;
  cantidad_entrada: number;
  cantidad_salida: number;
  saldo: number;
  costo_unitario?: number;
  costo_total?: number;
  ubicacion?: string;
  usuario?: string;
  notas?: string;
}

export interface InventoryFilters {
  search?: string;
  location_id?: string;
  branch_id?: string;
  tipo?: StockLocationType;
  bajo_stock?: boolean;
  sin_stock?: boolean;
  serializable?: boolean;
}

export interface InventoryStats {
  total_productos: number;
  productos_activos: number;
  ubicaciones_activas: number;
  alertas_pendientes: number;
  valor_total_inventario?: number;
  productos_sin_stock: number;
  productos_bajo_minimo: number;
}
