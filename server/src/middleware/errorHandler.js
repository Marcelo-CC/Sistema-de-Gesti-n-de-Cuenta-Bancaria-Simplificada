import mongoose from 'mongoose';

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ ok: false, error: err.message });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }

  console.error('💥 Error interno:', err);
  return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
}
