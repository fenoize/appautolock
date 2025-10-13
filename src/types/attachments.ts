export interface Attachment {
  id: string;
  entidad: string;
  entidad_id: string;
  nombre_archivo: string;
  url: string;
  tipo_archivo?: string;
  tamanio_bytes?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface AttachmentUploadOptions {
  entityType: string;
  entityId: string;
  file: File;
}
