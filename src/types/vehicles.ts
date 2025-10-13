export interface Vehicle {
  id: string;
  client_id: string;
  patente: string;
  vin?: string;
  marca: string;
  modelo: string;
  anio?: number;
  combustible?: string;
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
