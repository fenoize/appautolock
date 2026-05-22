export interface Vehicle {
  id: string;
  client_id: string;
  patente: string;
  vin?: string;
  marca: string;
  modelo: string;
  anio?: number;
  combustible?: string;
  tipo_encendido?: IgnitionType;
  odometro?: number;
  color?: string;
  numero_motor?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    razon_social?: string;
    nombre_comercial?: string;
    email_principal?: string;
  };
}

export interface VehicleFilters {
  search?: string;
  marca?: string;
  anio?: number;
  combustible?: string;
  tipo_encendido?: string;
  client_id?: string;
}

export type FuelType = 'Bencina' | 'Diesel' | 'GLP' | 'Eléctrico' | 'Híbrido';

export const FUEL_TYPES: FuelType[] = [
  'Bencina',
  'Diesel',
  'GLP',
  'Eléctrico',
  'Híbrido'
];

export const IGNITION_TYPES = ['Llave', 'Push-Start', 'Sin llave', 'Desconocido'] as const;
export type IgnitionType = typeof IGNITION_TYPES[number];

