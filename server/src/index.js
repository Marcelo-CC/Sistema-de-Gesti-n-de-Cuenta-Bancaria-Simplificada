import 'dotenv/config';
import mongoose from 'mongoose';
import { crearApp } from './app.js';
import { conectarDB } from './config/db.js';

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banco_simplificado';

async function iniciar() {
  try {
    await conectarDB(MONGODB_URI);
  } catch (err) {
    console.error('❌ No se pudo conectar a MongoDB. ¿Está el servicio iniciado?', err.message);
    process.exit(1);
  }

  const app = crearApp({ clientOrigin: process.env.CLIENT_ORIGIN });
  const server = app.listen(PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${PORT}/api`);
  });

  const cerrar = async (senal) => {
    console.log(`\n${senal} recibido, cerrando servidor...`);
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on('SIGINT', () => cerrar('SIGINT'));
  process.on('SIGTERM', () => cerrar('SIGTERM'));
}

iniciar();
