import mongoose from 'mongoose';

let soportaTransacciones = false;

/**
 * Conecta a MongoDB local y detecta si el servidor admite transacciones
 * multi-documento (solo disponibles en replica sets).
 */
export async function conectarDB(uri) {
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB desconectado'));
  mongoose.connection.on('reconnected', () => console.log('🔄 MongoDB reconectado'));
  mongoose.connection.on('error', (err) => console.error('❌ Error de MongoDB:', err.message));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  soportaTransacciones = Boolean(hello.setName);

  console.log(`✅ MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log(
    soportaTransacciones
      ? '🔒 Replica set detectado: transferencias con transacciones ACID'
      : '🔒 Servidor standalone: transferencias con actualizaciones atómicas condicionales + compensación'
  );
}

export const admiteTransacciones = () => soportaTransacciones;
