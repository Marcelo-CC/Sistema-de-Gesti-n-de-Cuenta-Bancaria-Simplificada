import Icono from './Icono.jsx';
import { iniciales } from '../utils/formato.js';

export default function Navbar({ cuentas, cuentaActiva, onCambiarCuenta, conectado }) {
  const titular = cuentas.find((c) => c.numeroCuenta === cuentaActiva)?.titular ?? '';

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-violet-950/95 text-white backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-900/40">
              <Icono nombre="banco" className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-bold tracking-tight">BancoSimple</p>
              <p className="text-xs text-violet-300">Banca por internet</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:hidden ${
              conectado ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            <span className={`size-1.5 rounded-full ${conectado ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {conectado ? 'En línea' : 'Sin conexión'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
              conectado ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            <span className={`size-1.5 rounded-full ${conectado ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {conectado ? 'API en línea' : 'Sin conexión'}
          </span>

          <label htmlFor="selector-cuenta" className="sr-only">
            Seleccionar cuenta
          </label>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/10 py-1 pl-1 pr-2 ring-1 ring-white/15 focus-within:ring-violet-400 sm:flex-none">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-500 text-xs font-bold">
              {iniciales(titular) || '··'}
            </span>
            <select
              id="selector-cuenta"
              value={cuentaActiva ?? ''}
              onChange={(e) => onCambiarCuenta(e.target.value)}
              disabled={cuentas.length === 0}
              className="w-full min-w-0 cursor-pointer bg-transparent text-sm font-medium outline-none sm:w-56 [&>option]:text-slate-900"
            >
              {cuentas.length === 0 && <option value="">Sin cuentas</option>}
              {cuentas.map((c) => (
                <option key={c.numeroCuenta} value={c.numeroCuenta}>
                  {c.numeroCuenta} · {c.titular}
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>
    </header>
  );
}
