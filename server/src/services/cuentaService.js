import mongoose from 'mongoose';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';
import { admiteTransacciones } from '../config/db.js';
import { badRequest, notFound } from '../utils/errores.js';

/**
 * Ejecuta una operación bancaria de forma segura:
 *  - Si MongoDB es un replica set → transacción ACID real (commit/abort).
 *  - Si es standalone (instalación local típica) → cada paso usa actualizaciones
 *    atómicas condicionales ($inc + filtro de saldo) y, si un paso posterior
 *    falla, se ejecutan las compensaciones registradas en orden inverso.
 *
 * `trabajo(ctx)` recibe { session, alDeshacer(fn) }.
 */
async function ejecutarSeguro(trabajo) {
  if (admiteTransacciones()) {
    const session = await mongoose.startSession();
    try {
      let resultado;
      await session.withTransaction(async () => {
        resultado = await trabajo({ session, alDeshacer: () => {} });
      });
      return resultado;
    } finally {
      await session.endSession();
    }
  }

  const compensaciones = [];
  try {
    return await trabajo({ session: null, alDeshacer: (fn) => compensaciones.push(fn) });
  } catch (err) {
    for (const deshacer of compensaciones.reverse()) {
      try {
        await deshacer();
      } catch (errComp) {
        console.error('‼️  Falló una compensación, revisar consistencia:', errComp);
      }
    }
    throw err;
  }
}

async function buscarCuentaOFallar(numeroCuenta, session = null, etiqueta = 'La cuenta') {
  const cuenta = await Cuenta.findOne({ numeroCuenta }).session(session);
  if (!cuenta) throw notFound(`${etiqueta} ${numeroCuenta} no existe`);
  return cuenta;
}

/** Suma (o resta, si centimos < 0) de forma atómica. Si `minimo` se indica, exige saldo >= minimo. */
function incrementarSaldo(numeroCuenta, centimos, session, minimo = null) {
  const filtro = { numeroCuenta };
  if (minimo !== null) filtro.saldoCentimos = { $gte: minimo };
  return Cuenta.findOneAndUpdate(
    filtro,
    { $inc: { saldoCentimos: centimos } },
    { returnDocument: 'after', session }
  );
}

async function registrarTransaccion(datos, session) {
  const [tx] = await Transaccion.create([datos], { session });
  return tx;
}

// ─────────────────────────────── Consultas ───────────────────────────────

export async function listarCuentas() {
  const cuentas = await Cuenta.find().sort({ numeroCuenta: 1 });
  return cuentas.map((c) => c.toPublic());
}

export async function obtenerCuenta(numeroCuenta) {
  const cuenta = await buscarCuentaOFallar(numeroCuenta);
  return cuenta.toPublic();
}

export async function obtenerHistorial(numeroCuenta, { limite = 20, tipo } = {}) {
  await buscarCuentaOFallar(numeroCuenta);
  const filtro = { $or: [{ cuentaOrigen: numeroCuenta }, { cuentaDestino: numeroCuenta }] };
  if (tipo) filtro.tipo = tipo;
  const [movimientos, total] = await Promise.all([
    Transaccion.find(filtro).sort({ fecha: -1, _id: -1 }).limit(limite),
    Transaccion.countDocuments(filtro),
  ]);
  return { total, movimientos: movimientos.map((t) => t.toPublic()) };
}

// ─────────────────────────────── Operaciones ───────────────────────────────

export function depositar(numeroCuenta, centimos, descripcion) {
  return ejecutarSeguro(async ({ session, alDeshacer }) => {
    const cuenta = await incrementarSaldo(numeroCuenta, centimos, session);
    if (!cuenta) throw notFound(`La cuenta ${numeroCuenta} no existe`);
    alDeshacer(() => incrementarSaldo(numeroCuenta, -centimos, null));

    const tx = await registrarTransaccion(
      {
        tipo: 'DEPOSITO',
        montoCentimos: centimos,
        cuentaDestino: numeroCuenta,
        descripcion,
        saldoDestinoDespuesCentimos: cuenta.saldoCentimos,
      },
      session
    );
    return { cuenta: cuenta.toPublic(), transaccion: tx.toPublic() };
  });
}

export function retirar(numeroCuenta, centimos, descripcion) {
  return ejecutarSeguro(async ({ session, alDeshacer }) => {
    // Filtro saldo >= monto: imposible dejar saldo negativo, incluso con peticiones concurrentes.
    const cuenta = await incrementarSaldo(numeroCuenta, -centimos, session, centimos);
    if (!cuenta) {
      const existente = await buscarCuentaOFallar(numeroCuenta, session);
      throw badRequest(
        `Saldo insuficiente. Disponible: ${(existente.saldoCentimos / 100).toFixed(2)}, solicitado: ${(centimos / 100).toFixed(2)}`
      );
    }
    alDeshacer(() => incrementarSaldo(numeroCuenta, centimos, null));

    const tx = await registrarTransaccion(
      {
        tipo: 'RETIRO',
        montoCentimos: centimos,
        cuentaOrigen: numeroCuenta,
        descripcion,
        saldoOrigenDespuesCentimos: cuenta.saldoCentimos,
      },
      session
    );
    return { cuenta: cuenta.toPublic(), transaccion: tx.toPublic() };
  });
}

export function transferir(origen, destino, centimos, descripcion) {
  if (origen === destino) {
    throw badRequest('La cuenta de origen y destino no pueden ser la misma');
  }

  return ejecutarSeguro(async ({ session, alDeshacer }) => {
    // 1. Validar existencia de ambas cuentas (404 si no existen)
    const cuentaOrigen = await buscarCuentaOFallar(origen, session, 'La cuenta de origen');
    const cuentaDestino = await buscarCuentaOFallar(destino, session, 'La cuenta destino');
    if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
      throw badRequest('Solo se permiten transferencias entre cuentas de la misma moneda');
    }

    // 2. Débito atómico condicionado a fondos suficientes
    const origenActualizada = await incrementarSaldo(origen, -centimos, session, centimos);
    if (!origenActualizada) {
      const actual = await buscarCuentaOFallar(origen, session, 'La cuenta de origen');
      throw badRequest(
        `Fondos insuficientes en la cuenta origen. Disponible: ${(actual.saldoCentimos / 100).toFixed(2)}`
      );
    }
    alDeshacer(() => incrementarSaldo(origen, centimos, null));

    // 3. Crédito atómico en destino
    const destinoActualizada = await incrementarSaldo(destino, centimos, session);
    if (!destinoActualizada) throw notFound(`La cuenta destino ${destino} no existe`);
    alDeshacer(() => incrementarSaldo(destino, -centimos, null));

    // 4. Registro del movimiento
    const tx = await registrarTransaccion(
      {
        tipo: 'TRANSFERENCIA',
        montoCentimos: centimos,
        cuentaOrigen: origen,
        cuentaDestino: destino,
        descripcion,
        saldoOrigenDespuesCentimos: origenActualizada.saldoCentimos,
        saldoDestinoDespuesCentimos: destinoActualizada.saldoCentimos,
      },
      session
    );

    return {
      cuenta: origenActualizada.toPublic(),
      cuentaDestino: { numeroCuenta: destinoActualizada.numeroCuenta, titular: destinoActualizada.titular },
      transaccion: tx.toPublic(),
    };
  });
}
