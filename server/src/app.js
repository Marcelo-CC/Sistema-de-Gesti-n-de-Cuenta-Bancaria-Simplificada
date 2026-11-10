import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cuentaRoutes from './routes/cuentaRoutes.js';
import { manejadorErrores, rutaNoEncontrada } from './middleware/errorHandler.js';

export function crearApp({ clientOrigin } = {}) {
  const app = express();

  app.use(cors({ origin: clientOrigin || true }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (req, res) => {
    const estados = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    res.json({ ok: true, mongo: estados[mongoose.connection.readyState] ?? 'desconocido' });
  });

  app.use('/api/cuenta', cuentaRoutes);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}
