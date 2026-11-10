import { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import SaldoCard from './components/SaldoCard.jsx';
import FormOperacion from './components/FormOperacion.jsx';
import HistorialTransacciones from './components/HistorialTransacciones.jsx';
import Alerta from './components/Alerta.jsx';
import Icono from './components/Icono.jsx';
import { api } from './services/api.js';

const CLAVE_STORAGE = 'banco:cuentaActiva';
const ACCIONES = { deposito: api.depositar, retiro: api.retirar, transferencia: api.transferir };

function leerCuentaGuardada() {
  try {
    return localStorage.getItem(CLAVE_STORAGE);
  } catch {
    return null;
  }
}

export default function App() {
  // Cuentas disponibles y conexión con la API
  const [cuentas, setCuentas] = useState([]);
  const [conexion, setConexion] = useState({ estado: 'cargando', error: null });
  const [intentoConexion, setIntentoConexion] = useState(0);

  // Cuenta seleccionada y sus datos
  const [cuentaActiva, setCuentaActiva] = useState(leerCuentaGuardada);
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState({ movimientos: [], total: 0 });
  const [errorDatos, setErrorDatos] = useState(null);

  // `version` fuerza la recarga de saldo + historial; `cargadoPara` indica qué versión ya se cargó
  const [version, setVersion] = useState(0);
  const [cargadoPara, setCargadoPara] = useState(null);
  const claveActual = `${cuentaActiva}#${version}`;
  const cargando = cargadoPara !== claveActual;

  const [alerta, setAlerta] = useState(null);
  const cerrarAlerta = useCallback(() => setAlerta(null), []);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // 1) Al montar (o reintentar): obtener la lista de cuentas
  useEffect(() => {
    const controlador = new AbortController();
    api
      .listarCuentas(controlador.signal)
      .then(({ cuentas }) => {
        setCuentas(cuentas);
        setConexion({ estado: 'ok', error: null });
        setCuentaActiva((actual) =>
          cuentas.some((c) => c.numeroCuenta === actual) ? actual : (cuentas[0]?.numeroCuenta ?? null)
        );
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setConexion({ estado: 'error', error: err.message });
      });
    return () => controlador.abort();
  }, [intentoConexion]);

  // 2) Cada vez que cambia la cuenta activa o tras una operación: saldo + historial
  useEffect(() => {
    if (!cuentaActiva) return;
    try {
      localStorage.setItem(CLAVE_STORAGE, cuentaActiva);
    } catch {
      /* almacenamiento no disponible: se ignora */
    }

    const controlador = new AbortController();
    const clave = `${cuentaActiva}#${version}`;
    Promise.all([
      api.obtenerCuenta(cuentaActiva, controlador.signal),
      api.obtenerHistorial(cuentaActiva, 50, controlador.signal),
    ])
      .then(([{ cuenta }, { movimientos, total }]) => {
        setCuenta(cuenta);
        setHistorial({ movimientos, total });
        setErrorDatos(null);
        setConexion({ estado: 'ok', error: null });
        // Mantener sincronizado el saldo en la lista del selector
        setCuentas((lista) => lista.map((c) => (c.numeroCuenta === cuenta.numeroCuenta ? cuenta : c)));
        setCargadoPara(clave);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setErrorDatos(err.message);
        if (!err.status) setConexion({ estado: 'error', error: err.message });
        setCargadoPara(clave);
      });
    return () => controlador.abort();
  }, [cuentaActiva, version]);

  function cambiarCuenta(numero) {
    setCuenta(null);
    setHistorial({ movimientos: [], total: 0 });
    setCuentaActiva(numero);
  }

  /** Callback que recibe FormOperacion. Lanza el error para que el formulario lo muestre. */
  async function manejarOperacion(tipo, datos) {
    try {
      const respuesta = await ACCIONES[tipo](datos);
      setCuenta(respuesta.cuenta); // actualización inmediata del saldo
      const detalle =
        tipo === 'transferencia'
          ? `Enviado a ${respuesta.cuentaDestino.titular} (${respuesta.cuentaDestino.numeroCuenta})`
          : `Nuevo saldo: ${respuesta.cuenta.saldo.toLocaleString('es-PE', { style: 'currency', currency: respuesta.cuenta.moneda })}`;
      setAlerta({ id: Date.now(), tipo: 'exito', titulo: respuesta.mensaje, mensaje: detalle });
      recargar(); // sincroniza historial y saldo desde MongoDB
    } catch (err) {
      setAlerta({ id: Date.now(), tipo: 'error', titulo: 'Operación rechazada', mensaje: err.message });
      if (err.status === 400 || err.status === 404) recargar();
      throw err;
    }
  }

  const sinConexion = conexion.estado === 'error' && cuentas.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <Navbar
        cuentas={cuentas}
        cuentaActiva={cuentaActiva}
        onCambiarCuenta={cambiarCuenta}
        conectado={conexion.estado === 'ok'}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {sinConexion ? (
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600">
              <Icono nombre="alerta" className="size-7" />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">No hay conexión con la API</h1>
            <p className="mt-2 text-sm text-slate-500">{conexion.error}</p>
            <p className="mt-1 text-xs text-slate-400">
              Ejecuta <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code> en la carpeta /server.
            </p>
            <button
              type="button"
              onClick={() => setIntentoConexion((n) => n + 1)}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-700"
            >
              Reintentar
            </button>
          </div>
        ) : conexion.estado === 'ok' && cuentas.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">No hay cuentas registradas</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ejecuta <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run seed</code> en /server para crear cuentas de prueba.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Hola{cuenta ? `, ${cuenta.titular.split(' ')[0]}` : ''} 👋
              </h1>
              <p className="text-sm text-slate-500">Gestiona tu cuenta: consulta tu saldo, deposita, retira y transfiere.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-6 lg:col-span-2">
                <SaldoCard cuenta={cuenta} cargando={cargando} onRefrescar={recargar} />
                <FormOperacion key={cuentaActiva} cuenta={cuenta} cuentas={cuentas} onOperar={manejarOperacion} />
              </div>
              <div className="lg:col-span-3">
                <HistorialTransacciones
                  cuenta={cuenta ?? { numeroCuenta: cuentaActiva, moneda: 'PEN' }}
                  movimientos={historial.movimientos}
                  total={historial.total}
                  cargando={cargando}
                  error={errorDatos}
                  onReintentar={recargar}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        BancoSimple · Proyecto académico de Ingeniería Web · React + Vite + Tailwind · Node.js + Express + MongoDB
      </footer>

      <Alerta alerta={alerta} onCerrar={cerrarAlerta} />
    </div>
  );
}
