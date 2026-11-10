import { useState } from 'react';
import Icono from './Icono.jsx';
import { formatoFecha, formatoMoneda } from '../utils/formato.js';

const FILTROS = [
  { clave: 'TODOS', etiqueta: 'Todos' },
  { clave: 'DEPOSITO', etiqueta: 'Depósitos' },
  { clave: 'RETIRO', etiqueta: 'Retiros' },
  { clave: 'TRANSFERENCIA', etiqueta: 'Transferencias' },
];

/** Determina cómo se ve un movimiento desde la perspectiva de la cuenta activa. */
function describir(mov, numeroCuenta) {
  const entrante = mov.cuentaDestino === numeroCuenta;
  if (mov.tipo === 'DEPOSITO') {
    return { titulo: 'Depósito', detalle: 'Ingreso en ventanilla', icono: 'deposito', entrante: true };
  }
  if (mov.tipo === 'RETIRO') {
    return { titulo: 'Retiro', detalle: 'Retiro de efectivo', icono: 'retiro', entrante: false };
  }
  return entrante
    ? { titulo: 'Transferencia recibida', detalle: `De la cuenta ${mov.cuentaOrigen}`, icono: 'transferencia', entrante: true }
    : { titulo: 'Transferencia enviada', detalle: `A la cuenta ${mov.cuentaDestino}`, icono: 'transferencia', entrante: false };
}

function Fila({ mov, cuenta }) {
  const info = describir(mov, cuenta.numeroCuenta);
  const { fecha, hora } = formatoFecha(mov.fecha);
  const saldoDespues = info.entrante ? mov.saldoDestinoDespues : mov.saldoOrigenDespues;

  return (
    <li className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          info.entrante ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}
      >
        <Icono nombre={info.icono} className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{info.titulo}</p>
        <p className="truncate text-xs text-slate-500">
          {mov.descripcion || info.detalle}
          {mov.descripcion && mov.tipo === 'TRANSFERENCIA' && ` · ${info.detalle}`}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 sm:hidden">
          {fecha} · {hora}
        </p>
      </div>

      <div className="hidden w-28 text-right text-xs text-slate-500 sm:block">
        <p>{fecha}</p>
        <p className="text-slate-400">{hora}</p>
      </div>

      <div className="w-28 text-right">
        <p className={`font-semibold tabular-nums ${info.entrante ? 'text-emerald-600' : 'text-rose-600'}`}>
          {info.entrante ? '+' : '−'}
          {formatoMoneda(mov.monto, cuenta.moneda)}
        </p>
        {saldoDespues != null && (
          <p className="text-xs text-slate-400 tabular-nums">Saldo {formatoMoneda(saldoDespues, cuenta.moneda)}</p>
        )}
      </div>
    </li>
  );
}

export default function HistorialTransacciones({ cuenta, movimientos, total, cargando, error, onReintentar }) {
  const [filtro, setFiltro] = useState('TODOS');
  const visibles = filtro === 'TODOS' ? movimientos : movimientos.filter((m) => m.tipo === filtro);

  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 pt-5 pb-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Icono nombre="historial" className="size-5 text-violet-600" />
            Historial de movimientos
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {movimientos.length} de {total}
          </span>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTROS.map((f) => (
            <button
              key={f.clave}
              type="button"
              onClick={() => setFiltro(f.clave)}
              aria-pressed={filtro === f.clave}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                filtro === f.clave
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Icono nombre="alerta" className="size-8 text-rose-400" />
          <p className="text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={onReintentar}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Reintentar
          </button>
        </div>
      ) : cargando && movimientos.length === 0 ? (
        <ul className="divide-y divide-slate-100" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex animate-pulse items-center gap-3 px-6 py-4">
              <span className="size-10 rounded-xl bg-slate-200" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-1/3 rounded bg-slate-200" />
                <span className="block h-2.5 w-1/2 rounded bg-slate-100" />
              </span>
              <span className="h-3 w-16 rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      ) : visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-slate-500">
          <Icono nombre="vacio" className="size-9 text-slate-300" />
          <p className="font-medium">Sin movimientos</p>
          <p className="text-sm text-slate-400">
            {filtro === 'TODOS' ? 'Las operaciones que realices aparecerán aquí.' : 'No hay movimientos de este tipo.'}
          </p>
        </div>
      ) : (
        <ul className={`max-h-[34rem] divide-y divide-slate-100 overflow-y-auto transition-opacity ${cargando ? 'opacity-60' : ''}`}>
          {visibles.map((mov) => (
            <Fila key={mov.id} mov={mov} cuenta={cuenta} />
          ))}
        </ul>
      )}
    </section>
  );
}
