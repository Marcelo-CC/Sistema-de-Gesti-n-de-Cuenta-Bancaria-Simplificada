import { useState } from 'react';
import Icono from './Icono.jsx';
import { formatoMoneda, validarMonto } from '../utils/formato.js';

const OPERACIONES = {
  deposito: {
    etiqueta: 'Depositar',
    icono: 'deposito',
    boton: 'Confirmar depósito',
    color: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600',
    activo: 'bg-white text-emerald-700 shadow-sm',
  },
  retiro: {
    etiqueta: 'Retirar',
    icono: 'retiro',
    boton: 'Confirmar retiro',
    color: 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600',
    activo: 'bg-white text-rose-700 shadow-sm',
  },
  transferencia: {
    etiqueta: 'Transferir',
    icono: 'transferencia',
    boton: 'Confirmar transferencia',
    color: 'bg-violet-600 hover:bg-violet-700 focus-visible:outline-violet-600',
    activo: 'bg-white text-violet-700 shadow-sm',
  },
};

const MONTOS_RAPIDOS = [20, 50, 100, 200];

/**
 * Formulario controlado para depósitos, retiros y transferencias.
 * El componente padre recibe la operación mediante el callback `onOperar`.
 */
export default function FormOperacion({ cuenta, cuentas, onOperar }) {
  const [tipo, setTipo] = useState('deposito');
  const [monto, setMonto] = useState('');
  const [destino, setDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [tocado, setTocado] = useState(false);

  const op = OPERACIONES[tipo];
  const saldo = cuenta?.saldo ?? 0;
  const limite = tipo === 'deposito' ? Infinity : saldo;
  const otrasCuentas = cuentas.filter((c) => c.numeroCuenta !== cuenta?.numeroCuenta);
  const cuentaDestino = cuentas.find((c) => c.numeroCuenta === destino.trim());

  function validar() {
    const nuevos = {};
    const errMonto = validarMonto(monto, limite);
    if (errMonto) nuevos.monto = errMonto;
    if (tipo === 'transferencia') {
      const d = destino.trim();
      if (!d) nuevos.destino = 'Indica la cuenta destino';
      else if (!/^\d{4,20}$/.test(d)) nuevos.destino = 'Solo dígitos (mín. 4)';
      else if (d === cuenta?.numeroCuenta) nuevos.destino = 'No puedes transferirte a la misma cuenta';
    }
    return nuevos;
  }

  const erroresVisibles = tocado ? validar() : errores;

  function cambiarTipo(nuevo) {
    setTipo(nuevo);
    setErrores({});
    setTocado(false);
  }

  function limpiar() {
    setMonto('');
    setDestino('');
    setDescripcion('');
    setErrores({});
    setTocado(false);
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    setTocado(true);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const datos =
      tipo === 'transferencia'
        ? { cuentaOrigen: cuenta.numeroCuenta, cuentaDestino: destino.trim(), monto: Number(monto), descripcion }
        : { numeroCuenta: cuenta.numeroCuenta, monto: Number(monto), descripcion };
    try {
      await onOperar(tipo, datos);
      limpiar();
    } catch (err) {
      setTocado(false);
      setErrores({ general: err.message });
    } finally {
      setEnviando(false);
    }
  }

  const claseInput = (error) =>
    `w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:bg-slate-50 ${
      error
        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
        : 'border-slate-300 focus:border-violet-500 focus:ring-violet-100'
    }`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Nueva operación</h2>

      {/* Pestañas */}
      <div role="tablist" aria-label="Tipo de operación" className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
        {Object.entries(OPERACIONES).map(([clave, o]) => (
          <button
            key={clave}
            type="button"
            role="tab"
            aria-selected={tipo === clave}
            onClick={() => cambiarTipo(clave)}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition ${
              tipo === clave ? o.activo : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icono nombre={o.icono} className="size-4" />
            <span>{o.etiqueta}</span>
          </button>
        ))}
      </div>

      <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-4">
        {tipo === 'transferencia' && (
          <div>
            <label htmlFor="destino" className="mb-1.5 block text-sm font-medium text-slate-700">
              Cuenta destino
            </label>
            <input
              id="destino"
              list="cuentas-destino"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ej. 1002"
              value={destino}
              onChange={(e) => setDestino(e.target.value.replace(/\D/g, ''))}
              disabled={enviando}
              aria-invalid={Boolean(erroresVisibles.destino)}
              className={claseInput(erroresVisibles.destino)}
            />
            <datalist id="cuentas-destino">
              {otrasCuentas.map((c) => (
                <option key={c.numeroCuenta} value={c.numeroCuenta}>
                  {c.titular}
                </option>
              ))}
            </datalist>
            {erroresVisibles.destino ? (
              <p className="mt-1 text-xs text-rose-600">{erroresVisibles.destino}</p>
            ) : cuentaDestino ? (
              <p className="mt-1 text-xs text-emerald-700">✓ Titular: {cuentaDestino.titular}</p>
            ) : (
              destino && <p className="mt-1 text-xs text-amber-600">Cuenta no registrada en la lista; se validará en el servidor.</p>
            )}
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="monto" className="text-sm font-medium text-slate-700">
              Monto ({cuenta?.moneda ?? 'PEN'})
            </label>
            {tipo !== 'deposito' && (
              <span className="text-xs text-slate-500">Disponible: {formatoMoneda(saldo, cuenta?.moneda)}</span>
            )}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">S/</span>
            <input
              id="monto"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))}
              disabled={enviando}
              aria-invalid={Boolean(erroresVisibles.monto)}
              className={`${claseInput(erroresVisibles.monto)} pl-10 text-lg font-semibold tabular-nums`}
            />
          </div>
          {erroresVisibles.monto && <p className="mt-1 text-xs text-rose-600">{erroresVisibles.monto}</p>}

          <div className="mt-2 flex flex-wrap gap-2">
            {MONTOS_RAPIDOS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={enviando || m > limite}
                onClick={() => setMonto(String(m))}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                S/ {m}
              </button>
            ))}
            {tipo !== 'deposito' && saldo > 0 && (
              <button
                type="button"
                disabled={enviando}
                onClick={() => setMonto(saldo.toFixed(2))}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              >
                Todo
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-1.5 block text-sm font-medium text-slate-700">
            Descripción <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="descripcion"
            maxLength={140}
            placeholder="Ej. Pago de alquiler"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={enviando}
            className={claseInput(false)}
          />
        </div>

        {erroresVisibles.general && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
            <span>{erroresVisibles.general}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || !cuenta}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${op.color}`}
        >
          {enviando ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Procesando...
            </>
          ) : (
            <>
              <Icono nombre={op.icono} className="size-4" />
              {op.boton}
              {Number(monto) > 0 && ` · ${formatoMoneda(Number(monto), cuenta?.moneda)}`}
            </>
          )}
        </button>
      </form>
    </section>
  );
}
