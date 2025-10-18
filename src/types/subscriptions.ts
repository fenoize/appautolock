import { Database } from '@/integrations/supabase/types';

export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
export type NotificationChannel = Database['public']['Enums']['notification_channel'];

export interface NotificationReminderConfig {
  dias_previos: number;
  canal: NotificationChannel;
  activo: boolean;
}

export interface PlanNotificationConfig {
  recordatorios: NotificationReminderConfig[];
  incluir_datos_vehiculo: boolean;
  incluir_datos_cliente: boolean;
  campos_vehiculo: string[];
  campos_cliente: string[];
}

export interface PlanNotificationTemplate {
  asunto: string;
  cuerpo: string;
}

export interface SubscriptionPlan {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  periodo_meses: number;
  dias_gracia: number;
  suspension_automatica: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
  notificacion_config: PlanNotificationConfig;
  template_notificacion: PlanNotificationTemplate;
}

export interface Subscription {
  id: string;
  folio: string;
  client_id: string;
  vehicle_id?: string;
  plan_id: string;
  estado: SubscriptionStatus;
  fecha_inicio: string;
  fecha_vencimiento: string;
  ultima_notificacion_enviada?: string;
  fecha_ultima_notificacion?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  client?: any;
  vehicle?: any;
  plan?: SubscriptionPlan;
  events?: SubscriptionEvent[];
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  tipo: string;
  fecha: string;
  user_id?: string;
  notas?: string;
  user?: any;
}

export interface NotificationTemplate {
  id: string;
  evento: string;
  canal: NotificationChannel;
  asunto?: string;
  cuerpo: string;
  html_content?: string;
  variables_disponibles?: any;
  categoria?: string;
  descripcion?: string;
  subject_preview?: string;
  body_preview?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderSetting {
  id: string;
  evento: string;
  dias_previos: number;
  activo: boolean;
  canal_preferido: NotificationChannel;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFilters {
  search?: string;
  estado?: SubscriptionStatus;
  plan_id?: string;
  client_id?: string;
  vencimiento_desde?: string;
  vencimiento_hasta?: string;
}

export interface SubscriptionStats {
  total: number;
  activas: number;
  en_mora: number;
  suspendidas: number;
  canceladas: number;
  renovaciones_proximas_30d: number;
  renovaciones_proximas_7d: number;
  ingresos_mensuales_estimados: number;
}
