export type ClientType = 'empresa' | 'persona';
export type ClientStatus = 'prospecto' | 'activo' | 'mora' | 'suspendido';

export interface Client {
  id: string;
  tipo: ClientType;
  rut?: string;
  dv?: string;
  pasaporte?: string;
  razon_social?: string;
  giro?: string;
  nombre_comercial?: string;
  email_principal?: string;
  emails?: string[];
  telefonos?: string[];
  estado: ClientStatus;
  vendedor_id?: string;
  branch_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientContact {
  id: string;
  client_id: string;
  nombre: string;
  email?: string;
  phone?: string;
  cargo?: string;
  es_principal: boolean;
  created_at: string;
}

export interface ClientAddress {
  id: string;
  client_id: string;
  alias?: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigo_postal?: string;
  es_predeterminada: boolean;
  latitud?: number;
  longitud?: number;
  created_at: string;
}

export interface ClientFilters {
  search?: string;
  tipo?: ClientType;
  estado?: ClientStatus;
  vendedor_id?: string;
  branch_id?: string;
}
