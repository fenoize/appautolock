export interface NotificationVariable {
  id: string;
  categoria: string;
  variable: string;
  descripcion?: string;
  ejemplo?: string;
  tipo_dato: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  created_at: string;
}

export interface NotificationCondition {
  id: string;
  template_id: string;
  campo: string;
  operador: 'mayor_que' | 'menor_que' | 'igual_a' | 'contiene';
  valor: string;
  activo: boolean;
  created_at: string;
}

export interface TemplateData {
  cliente?: any;
  vehiculo?: any;
  cotizacion?: any;
  ot?: any;
  suscripcion?: any;
  sistema?: any;
}
