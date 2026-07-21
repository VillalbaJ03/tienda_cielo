/**
 * Convierte texto a número aceptando coma o punto como separador decimal.
 * En Ecuador se escribe "0,75"; los inputs no deben perder ese valor.
 * Devuelve NaN si no hay un número válido.
 */
export function parseNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (valor == null || String(valor).trim() === '') return NaN;
  return parseFloat(String(valor).trim().replace(',', '.'));
}

/**
 * Formatea un número como moneda (USD para Ecuador).
 */
export function formatMoneda(valor) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(valor || 0);
}

/**
 * Formatea una fecha ISO a formato legible en español.
 */
export function formatFecha(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea fecha y hora.
 */
export function formatFechaHora(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD.
 */
export function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Categorías de gastos disponibles.
 */
export const CATEGORIAS_GASTOS = [
  'Servicios',
  'Arriendo',
  'Personal',
  'Transporte',
  'Otros',
];

/**
 * Categorías de productos.
 */
export const CATEGORIAS_PRODUCTOS = [
  'Bebidas',
  'Snacks',
  'Lácteos',
  'Limpieza',
  'Granos',
  'Enlatados',
  'Cuidado personal',
  'Otros',
];

/**
 * Métodos de pago disponibles.
 */
export const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'fiado', label: 'Fiado' },
];
