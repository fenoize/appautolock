/**
 * Utilidades de validación de archivos
 */

/**
 * Valida el tamaño de un archivo
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Valida el tipo MIME de un archivo
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      // Permite "image/*", "application/*", etc.
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    return file.type === type;
  });
}

/**
 * Formatea bytes en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Tipos de archivo permitidos para adjuntos
 */
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

/**
 * Tamaño máximo de archivo en MB
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Obtiene la extensión de un archivo
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Valida un archivo adjunto completo
 */
export function validateAttachment(file: File): { valid: boolean; error?: string } {
  if (!validateFileType(file, ALLOWED_ATTACHMENT_TYPES)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se permiten imágenes, PDFs y documentos de Office.'
    };
  }

  if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB. Tamaño actual: ${formatFileSize(file.size)}`
    };
  }

  return { valid: true };
}
