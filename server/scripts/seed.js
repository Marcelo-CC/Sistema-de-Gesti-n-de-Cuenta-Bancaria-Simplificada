/**
 * Script seed: limpia la base de datos y crea cuentas de prueba con
 * algunos movimientos iniciales para que el historial no esté vacío.
 *
 * Uso:  npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Cuenta from '../src/models/Cuenta.js';
import Transaccion from '../src/models/Transaccion.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banco_simplificado';

const cuentas = [
  { numeroCuenta: '1001', titular: 'Ana Torres Quispe', email: 'ana.torres@demo.pe', saldo: 2500.0 },
  { numeroCuenta: '1002', titular: 'Luis Ramírez Huamán', email: 'luis.ramirez@demo.pe', saldo: 1200.5 },
  { numeroCuenta: '1003', titular: 'María Fernández Rojas', email: 'maria.fernandez@demo.pe', saldo: 830.75 },
  { numeroCuenta: '1004', titular: 'Jorge Castillo Mendoza', email: 'jorge.castillo@demo.pe', saldo: 50.0 },
  { numeroCuenta: '1005', titular: 'Carla Vargas Paredes', email: 'carla.vargas@demo.pe', saldo: 0 },
];

const c = (soles) => Math.round(soles * 100);
const haceDias = (dias, horas = 0) => new Date(Date.now() - (dias * 24 + horas) * 3600 * 1000);

async function seed() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`🔌 Conectado a ${mongoose.connection.host}/${mongoose.connection.name}`);

  await Promise.all([Cuenta.deleteMany({}), Transaccion.deleteMany({})]);
  console.log('🧹 Colecciones "cuentas" y "transacciones" vaciadas');

  // Los saldos finales de arriba son el resultado de estos movimientos.
  const movimientos = [
    { tipo: 'DEPOSITO', monto: 3000, destino: '1001', fecha: haceDias(10), descripcion: 'Depósito inicial' },
    { tipo: 'DEPOSITO', monto: 1000, destino: '1002', fecha: haceDias(9), descripcion: 'Depósito inicial' },
    { tipo: 'DEPOSITO', monto: 1030.75, destino: '1003', fecha: haceDias(9, 3), descripcion: 'Depósito inicial' },
    { tipo: 'DEPOSITO', monto: 150, destino: '1004', fecha: haceDias(8), descripcion: 'Depósito inicial' },
    { tipo: 'TRANSFERENCIA', monto: 300, origen: '1001', destino: '1002', fecha: haceDias(6), descripcion: 'Pago de alquiler' },
    { tipo: 'RETIRO', monto: 200, origen: '1001', fecha: haceDias(4), descripcion: 'Retiro en cajero' },
    { tipo: 'TRANSFERENCIA', monto: 200, origen: '1003', destino: '1002', fecha: haceDias(3), descripcion: 'Devolución préstamo' },
    { tipo: 'RETIRO', monto: 100, origen: '1004', fecha: haceDias(2), descripcion: 'Compra en bodega' },
    { tipo: 'RETIRO', monto: 299.5, origen: '1002', fecha: haceDias(1), descripcion: 'Pago de servicios' },
  ];

  // Reproducir movimientos para calcular saldos intermedios coherentes
  const saldos = Object.fromEntries(cuentas.map((x) => [x.numeroCuenta, 0]));
  const transacciones = movimientos.map((m) => {
    const monto = c(m.monto);
    if (m.origen) saldos[m.origen] -= monto;
    if (m.destino) saldos[m.destino] += monto;
    return {
      tipo: m.tipo,
      montoCentimos: monto,
      cuentaOrigen: m.origen ?? null,
      cuentaDestino: m.destino ?? null,
      descripcion: m.descripcion,
      saldoOrigenDespuesCentimos: m.origen ? saldos[m.origen] : null,
      saldoDestinoDespuesCentimos: m.destino ? saldos[m.destino] : null,
      fecha: m.fecha,
    };
  });

  for (const cuenta of cuentas) {
    if (saldos[cuenta.numeroCuenta] !== c(cuenta.saldo)) {
      throw new Error(`Seed inconsistente para la cuenta ${cuenta.numeroCuenta}`);
    }
  }

  await Cuenta.insertMany(
    cuentas.map(({ saldo, ...resto }) => ({ ...resto, moneda: 'PEN', saldoCentimos: c(saldo) }))
  );
  await Transaccion.insertMany(transacciones);
  await Cuenta.syncIndexes();
  await Transaccion.syncIndexes();

  console.log(`✅ ${cuentas.length} cuentas y ${transacciones.length} transacciones creadas:\n`);
  console.table(cuentas.map((x) => ({ Cuenta: x.numeroCuenta, Titular: x.titular, Saldo: x.saldo.toFixed(2) })));
}

seed()
  .catch((err) => {
    console.error('❌ Error en el seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
