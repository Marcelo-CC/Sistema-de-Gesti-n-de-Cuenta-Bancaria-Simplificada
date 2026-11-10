import { badRequest } from '../utils/errores.js';

const MONTO_MAXIMO = 1_000_000;

/** Valida y normaliza un número de cuenta. */
export function validarNumeroCuenta(valor, campo = 'numeroCuenta') {
  const numero = typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '';
  if (!/^\d{4,20}$/.test(numero)) {
    throw badRequest(`El campo "${campo}" debe ser un número de cuenta válido (solo dígitos)`);
  }
  return numero;
}

/**
 * Valida que el monto sea un número positivo con máximo 2 decimales
 * y lo devuelve convertido a céntimos (entero).
 */
export function validarMontoCentimos(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw badRequest('El monto es obligatorio');
  }
  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw badRequest('El monto debe ser numérico');
  }
  const monto = Number(valor);
  if (!Number.isFinite(monto)) throw badRequest('El monto debe ser numérico');
  if (monto <= 0) throw badRequest('El monto debe ser mayor a cero');
  if (monto > MONTO_MAXIMO) {
    throw badRequest(`El monto no puede superar ${MONTO_MAXIMO.toLocaleString('es-PE')}`);
  }
  const centimos = Math.round(monto * 100);
  if (Math.abs(centimos - monto * 100) > 1e-6) {
    throw badRequest('El monto admite como máximo 2 decimales');
  }
  return centimos;
}

export function validarDescripcion(valor) {
  if (valor === undefined || valor === null) return '';
  if (typeof valor !== 'string') throw badRequest('La descripción debe ser texto');
  if (valor.length > 140) throw badRequest('La descripción admite como máximo 140 caracteres');
  return valor.trim();
}
