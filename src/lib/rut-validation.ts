/**
 * Utilidades de validación de RUT chileno
 * Algoritmo Módulo 11
 */

/**
 * Limpia el RUT removiendo puntos y guiones
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador esperado usando módulo 11
 */
export function calculateDV(rut: string): string {
  const cleanedRut = cleanRut(rut);
  const rutNumbers = cleanedRut.replace(/[^0-9]/g, '');
  
  let sum = 0;
  let multiplier = 2;

  for (let i = rutNumbers.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumbers[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida RUT completo (número + DV)
 */
export function validateRUT(rut: string, dv: string): boolean {
  if (!rut || !dv) return false;

  const cleanedRut = cleanRut(rut);
  const cleanedDV = dv.toUpperCase();
  const expectedDV = calculateDV(cleanedRut);

  return cleanedDV === expectedDV;
}

/**
 * Valida un RUT completo con formato "12345678-9"
 */
export function validateFullRUT(fullRut: string): boolean {
  const cleaned = cleanRut(fullRut);
  
  // Extraer número y DV
  const match = cleaned.match(/^(\d+)([0-9K])$/);
  if (!match) return false;

  const [, rut, dv] = match;
  return validateRUT(rut, dv);
}

/**
 * Formatea RUT en formato estándar 12.345.678-9
 */
export function formatRUT(rut: string, dv?: string): string {
  const cleanedRut = cleanRut(rut).replace(/[^0-9]/g, '');
  
  if (!cleanedRut) return '';

  // Agregar puntos de miles
  const formatted = cleanedRut.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Agregar DV si se proporciona
  if (dv) {
    return `${formatted}-${dv.toUpperCase()}`;
  }

  return formatted;
}

/**
 * Extrae número y DV de un RUT completo
 */
export function splitRUT(fullRut: string): { rut: string; dv: string } | null {
  const cleaned = cleanRut(fullRut);
  const match = cleaned.match(/^(\d+)([0-9K])$/);
  
  if (!match) return null;
  
  return {
    rut: match[1],
    dv: match[2]
  };
}
