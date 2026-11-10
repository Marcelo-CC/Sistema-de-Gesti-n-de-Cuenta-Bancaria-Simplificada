const API_URL = import.meta.env.VITE_API_URL || '/api';

/** Wrapper de fetch que normaliza errores devueltos por la API. */
async function peticion(ruta, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('No se pudo conectar con el servidor. Verifica que la API esté en ejecución.', {
      cause: err,
    });
  }

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(datos.error || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return datos;
}

export const api = {
  listarCuentas: (signal) => peticion('/cuenta', { signal }),
  obtenerCuenta: (id, signal) => peticion(`/cuenta/${encodeURIComponent(id)}`, { signal }),
  obtenerHistorial: (id, limite = 50, signal) =>
    peticion(`/cuenta/${encodeURIComponent(id)}/historial?limite=${limite}`, { signal }),
  depositar: (datos) => peticion('/cuenta/deposito', { method: 'POST', body: datos }),
  retirar: (datos) => peticion('/cuenta/retiro', { method: 'POST', body: datos }),
  transferir: (datos) => peticion('/cuenta/transferencia', { method: 'POST', body: datos }),
};
