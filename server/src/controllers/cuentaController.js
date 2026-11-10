import * as servicio from '../services/cuentaService.js';
import {
  validarNumeroCuenta,
  validarMontoCentimos,
  validarDescripcion,
} from '../middleware/validaciones.js';
import { asyncHandler, badRequest } from '../utils/errores.js';

const TIPOS = ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA'];

/** GET /api/cuenta — lista de cuentas (para el selector del frontend) */
export const listar = asyncHandler(async (req, res) => {
  const cuentas = await servicio.listarCuentas();
  res.json({ ok: true, cuentas });
});

/** GET /api/cuenta/:id — saldo y datos de la cuenta */
export const obtener = asyncHandler(async (req, res) => {
  const numero = validarNumeroCuenta(req.params.id, 'id');
  const cuenta = await servicio.obtenerCuenta(numero);
  res.json({ ok: true, cuenta });
});

/** GET /api/cuenta/:id/historial?limite=20&tipo=DEPOSITO */
export const historial = asyncHandler(async (req, res) => {
  const numero = validarNumeroCuenta(req.params.id, 'id');

  let limite = 20;
  if (req.query.limite !== undefined) {
    limite = Number(req.query.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
      throw badRequest('El parámetro "limite" debe ser un entero entre 1 y 100');
    }
  }
  let tipo;
  if (req.query.tipo) {
    tipo = String(req.query.tipo).toUpperCase();
    if (!TIPOS.includes(tipo)) throw badRequest(`El parámetro "tipo" debe ser uno de: ${TIPOS.join(', ')}`);
  }

  const resultado = await servicio.obtenerHistorial(numero, { limite, tipo });
  res.json({ ok: true, ...resultado });
});

/** POST /api/cuenta/deposito  { numeroCuenta, monto, descripcion? } */
export const deposito = asyncHandler(async (req, res) => {
  const numero = validarNumeroCuenta(req.body?.numeroCuenta);
  const centimos = validarMontoCentimos(req.body?.monto);
  const descripcion = validarDescripcion(req.body?.descripcion);
  const resultado = await servicio.depositar(numero, centimos, descripcion);
  res.status(201).json({ ok: true, mensaje: 'Depósito realizado con éxito', ...resultado });
});

/** POST /api/cuenta/retiro  { numeroCuenta, monto, descripcion? } */
export const retiro = asyncHandler(async (req, res) => {
  const numero = validarNumeroCuenta(req.body?.numeroCuenta);
  const centimos = validarMontoCentimos(req.body?.monto);
  const descripcion = validarDescripcion(req.body?.descripcion);
  const resultado = await servicio.retirar(numero, centimos, descripcion);
  res.status(201).json({ ok: true, mensaje: 'Retiro realizado con éxito', ...resultado });
});

/** POST /api/cuenta/transferencia  { cuentaOrigen, cuentaDestino, monto, descripcion? } */
export const transferencia = asyncHandler(async (req, res) => {
  const origen = validarNumeroCuenta(req.body?.cuentaOrigen, 'cuentaOrigen');
  const destino = validarNumeroCuenta(req.body?.cuentaDestino, 'cuentaDestino');
  const centimos = validarMontoCentimos(req.body?.monto);
  const descripcion = validarDescripcion(req.body?.descripcion);
  const resultado = await servicio.transferir(origen, destino, centimos, descripcion);
  res.status(201).json({ ok: true, mensaje: 'Transferencia realizada con éxito', ...resultado });
});
