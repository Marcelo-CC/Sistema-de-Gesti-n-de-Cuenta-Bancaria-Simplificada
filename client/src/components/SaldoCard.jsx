import { useState } from 'react';
import Icono from './Icono.jsx';
import { formatoMoneda } from '../utils/formato.js';

export default function SaldoCard({ cuenta, cargando, onRefrescar }) {
  const [oculto, setOculto] = useState(false);

  if (!cuenta) {
    return (
      <section aria-busy="true" className="animate-pulse rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-700 p-6 shadow-xl">
        <div className="h-4 w-32 rounded bg-white/20" />
        <div className="mt-6 h-10 w-56 rounded bg-white/25" />
        <div className="mt-8 h-4 w-40 rounded bg-white/20" />
      </section>
    );
  }

  return (
    <section
      aria-label="Saldo de la cuenta"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 p-6 text-white shadow-xl shadow-violet-900/20 sm:p-7"
    >
      {/* Decoración */}
      <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-16 -bottom-20 size-44 rounded-full bg-indigo-400/20" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-200">Saldo disponible</p>
          <p className="mt-0.5 text-xs text-violet-300">Cuenta de ahorros · {cuenta.moneda}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setOculto((v) => !v)}
            className="rounded-lg p-2 text-violet-100 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            aria-label={oculto ? 'Mostrar saldo' : 'Ocultar saldo'}
            title={oculto ? 'Mostrar saldo' : 'Ocultar saldo'}
          >
            <Icono nombre={oculto ? 'ojo' : 'ojoCerrado'} className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={onRefrescar}
            disabled={cargando}
            className="rounded-lg p-2 text-violet-100 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-60"
            aria-label="Actualizar saldo"
            title="Actualizar"
          >
            <Icono nombre="refrescar" className={`size-4.5 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* La key cambia con el saldo → React vuelve a montar el nodo y se reproduce la animación */}
      <p
        key={`${cuenta.numeroCuenta}-${cuenta.saldo}`}
        aria-live="polite"
        className="relative mt-5 origin-left animate-destello text-4xl font-bold tracking-tight tabular-nums sm:text-5xl"
      >
        {oculto ? '••••••' : formatoMoneda(cuenta.saldo, cuenta.moneda)}
      </p>

      <div className="relative mt-8 flex flex-wrap items-end justify-between gap-4 text-sm">
        <div>
          <p className="text-xs tracking-wider text-violet-300 uppercase">Titular</p>
          <p className="font-semibold">{cuenta.titular}</p>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-wider text-violet-300 uppercase">N.º de cuenta</p>
          <p className="font-mono font-semibold tracking-widest">{cuenta.numeroCuenta}</p>
        </div>
      </div>
    </section>
  );
}
