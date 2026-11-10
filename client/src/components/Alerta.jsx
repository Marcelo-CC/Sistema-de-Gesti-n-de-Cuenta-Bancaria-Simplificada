import { useEffect } from 'react';
import Icono from './Icono.jsx';

const estilos = {
  exito: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
};

/** Notificación flotante que se cierra sola a los pocos segundos. */
export default function Alerta({ alerta, onCerrar }) {
  useEffect(() => {
    if (!alerta) return;
    const t = setTimeout(onCerrar, alerta.tipo === 'error' ? 6000 : 4000);
    return () => clearTimeout(t);
  }, [alerta, onCerrar]);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      {alerta && (
        <div
          key={alerta.id}
          role={alerta.tipo === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg ${estilos[alerta.tipo]}`}
        >
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full ${
              alerta.tipo === 'exito' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}
          >
            <Icono nombre={alerta.tipo === 'exito' ? 'check' : 'alerta'} className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{alerta.titulo}</p>
            {alerta.mensaje && <p className="mt-0.5 text-sm opacity-90">{alerta.mensaje}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md p-1 opacity-60 transition hover:opacity-100"
            aria-label="Cerrar notificación"
          >
            <Icono nombre="cerrar" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
