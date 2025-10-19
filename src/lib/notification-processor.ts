import { TemplateData, NotificationCondition } from '@/types/notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un valor como moneda chilena
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Formatea una fecha en español
 */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Procesa un template reemplazando variables con datos reales
 */
export function processTemplate(template: string, data: TemplateData): string {
  if (!template) return '';
  
  let processed = template;
  
  // Expresión regular para encontrar variables {{categoria.campo}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  processed = processed.replace(variableRegex, (match, path) => {
    const trimmedPath = path.trim();
    
    // Separar categoría y campo
    const [categoria, ...campos] = trimmedPath.split('.');
    const campo = campos.join('.');
    
    // Buscar en los datos según la categoría
    let value: any;
    
    switch (categoria) {
      case 'cliente':
        value = getNestedValue(data.cliente, campo);
        break;
      case 'vehiculo':
        value = getNestedValue(data.vehiculo, campo);
        break;
      case 'cotizacion':
        value = getNestedValue(data.cotizacion, campo);
        // Formatear campos monetarios
        if (['total', 'neto', 'iva'].includes(campo) && value) {
          return formatCurrency(value);
        }
        // Formatear fechas
        if (['fecha_emision'].includes(campo) && value) {
          return formatDate(value);
        }
        break;
      case 'ot':
        value = getNestedValue(data.ot, campo);
        // Formatear fechas
        if (['fecha_programada'].includes(campo) && value) {
          return formatDate(value);
        }
        break;
      case 'suscripcion':
        value = getNestedValue(data.suscripcion, campo);
        // Formatear precio
        if (campo === 'precio' && value) {
          return formatCurrency(value);
        }
        // Formatear fechas
        if (['fecha_inicio', 'fecha_vencimiento'].includes(campo) && value) {
          return formatDate(value);
        }
        break;
      case 'empresa':
        value = getNestedValue(data.sistema?.empresa, campo);
        break;
      case 'sistema':
        if (campo === 'fecha_actual') {
          return formatDate(new Date());
        }
        if (campo === 'hora_actual') {
          return format(new Date(), 'HH:mm');
        }
        value = getNestedValue(data.sistema, campo);
        break;
      default:
        return match; // Mantener la variable si no se encuentra
    }
    
    return value !== undefined && value !== null ? String(value) : match;
  });
  
  return processed;
}

/**
 * Evalúa si se deben cumplir las condiciones para enviar una notificación
 */
export function evaluateConditions(
  conditions: NotificationCondition[],
  data: any
): boolean {
  // Si no hay condiciones, siempre enviar
  if (!conditions || conditions.length === 0) {
    return true;
  }
  
  // Todas las condiciones activas deben cumplirse
  return conditions
    .filter(c => c.activo)
    .every(condition => {
      const value = getNestedValue(data, condition.campo);
      
      switch (condition.operador) {
        case 'mayor_que':
          return parseFloat(value) > parseFloat(condition.valor);
        case 'menor_que':
          return parseFloat(value) < parseFloat(condition.valor);
        case 'igual_a':
          return String(value) === condition.valor;
        case 'contiene':
          return String(value).toLowerCase().includes(condition.valor.toLowerCase());
        default:
          return true;
      }
    });
}

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(html: string): string {
  // Lista de tags peligrosos
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
  
  let sanitized = html;
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    // También remover tags sin cierre
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });
  
  return sanitized;
}
