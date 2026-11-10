const formateadores = {};

export function formatoMoneda(valor, moneda = 'PEN') {
  formateadores[moneda] ??= new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
  });
  return formateadores[moneda].format(valor ?? 0);
}

const formatoFechaCorta = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' });

export function formatoFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  return { fecha: formatoFechaCorta.format(fecha), hora: formatoHora.format(fecha) };
}

export function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Valida un monto ingresado en el formulario. Devuelve un mensaje de error o null. */
export function validarMonto(texto, maximo = Infinity) {
  if (texto.trim() === '') return 'Ingresa un monto';
  const monto = Number(texto);
  if (!Number.isFinite(monto)) return 'El monto debe ser numérico';
  if (monto <= 0) return 'El monto debe ser mayor a cero';
  if (!/^\d+(\.\d{1,2})?$/.test(texto.trim())) return 'Máximo 2 decimales';
  if (monto > maximo) return 'El monto supera tu saldo disponible';
  return null;
}
