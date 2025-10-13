export interface SystemSetting {
  id: string;
  clave: string;
  valor: string;
  descripcion?: string;
  tipo_dato?: 'text' | 'number' | 'boolean' | 'secret';
  updated_at: string;
}

export interface CompanyInfo {
  razon_social: string;
  rut: string;
  direccion: string;
  telefono: string;
  email: string;
  sitio_web?: string;
  logo_url?: string;
}

export interface SystemPreferences {
  moneda: string;
  iva_porcentaje: number;
  timezone: string;
}

export interface NumeradorConfig {
  prefijo: string;
  padding: number;
}

export interface IntegrationKeys {
  mapbox_api_key?: string;
  onesignal_app_id?: string;
  onesignal_api_key?: string;
  whatsapp_api_url?: string;
}

export interface BackupConfig {
  enabled: boolean;
  frequency_days: number;
  retention_days: number;
}

export interface AuditLogEntry {
  id: string;
  fecha_hora: string;
  tabla: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id?: string;
  user_nombre?: string;
  registro_id: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
}

export interface AuditFilters {
  fecha_desde: string;
  fecha_hasta: string;
  tabla?: string;
  user_id?: string;
  accion?: string;
}
