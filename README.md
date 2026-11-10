# 🏦 BancoSimple: Sistema de Gestión de Cuenta Bancaria Simplificada

Aplicación web **Full-Stack** para gestionar una cuenta bancaria: consulta de saldo, depósitos, retiros, transferencias entre cuentas e historial de movimientos.

Trabajo práctico de **Ingeniería Web**: Node.js + Express + MongoDB (backend) y React + Vite + Tailwind CSS (frontend).

---

## 📁 Estructura del repositorio

```
.
├── server/                     # Backend: API REST (Node.js + Express + Mongoose)
│   ├── scripts/seed.js         # Script seed: crea cuentas y movimientos de prueba
│   ├── src/
│   │   ├── config/db.js        # Conexión a MongoDB local
│   │   ├── models/             # Esquemas Mongoose: Cuenta, Transaccion
│   │   ├── services/           # Lógica de negocio (operaciones atómicas)
│   │   ├── controllers/        # Controladores HTTP (validación + respuesta)
│   │   ├── routes/             # Definición de rutas Express
│   │   ├── middleware/         # Validaciones y manejo centralizado de errores
│   │   ├── utils/              # Errores HTTP y helpers
│   │   ├── app.js              # Configuración de Express
│   │   └── index.js            # Punto de entrada del servidor
│   └── .env.example
│
└── client/                     # Frontend: React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx                  # Barra superior + selector de cuenta
    │   │   ├── SaldoCard.jsx               # Tarjeta de saldo
    │   │   ├── FormOperacion.jsx           # Depósito / Retiro / Transferencia
    │   │   ├── HistorialTransacciones.jsx  # Lista de movimientos con filtros
    │   │   ├── Alerta.jsx                  # Notificaciones de éxito / error
    │   │   └── Icono.jsx                   # Iconos SVG
    │   ├── services/api.js     # Cliente HTTP de la API
    │   ├── utils/formato.js    # Formato de moneda / fecha y validaciones
    │   ├── App.jsx             # Componente raíz: estado global y efectos
    │   └── main.jsx
    ├── vite.config.js          # Plugins React + Tailwind y proxy /api → :4000
    └── .env.example
```

---

## ✅ Requisitos previos

| Herramienta | Versión recomendada |
|---|---|
| [Node.js](https://nodejs.org/) | 20 o superior (probado con 24) |
| npm | 10 o superior |
| [MongoDB Community Server](https://www.mongodb.com/try/download/community) | 6 o superior, ejecutándose en local (`mongodb://127.0.0.1:27017`) |

Verifica que MongoDB esté corriendo:

```bash
# Windows (PowerShell): el servicio debe aparecer como "Running"
Get-Service MongoDB

# Linux / macOS
mongosh --eval "db.runCommand({ ping: 1 })"
```

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd <carpeta-del-repositorio>
```

### 2. Backend (`/server`)

```bash
cd server
npm install
cp .env.example .env        # En Windows (cmd): copy .env.example .env
npm run seed                # Crea las cuentas de prueba en MongoDB
npm run dev                 # Inicia la API en http://localhost:4000 (con recarga automática)
```

> Para producción usa `npm start` en lugar de `npm run dev`.

### 3. Frontend (`/client`): en **otra terminal**

```bash
cd client
npm install
npm run dev                 # Abre http://localhost:5173
```

El servidor de desarrollo de Vite redirige las peticiones `/api/*` al backend (`http://localhost:4000`), así que no hace falta configurar CORS en desarrollo.

### Scripts disponibles

| Carpeta | Comando | Descripción |
|---|---|---|
| server | `npm run dev` | Inicia la API con recarga automática (`node --watch`) |
| server | `npm start` | Inicia la API |
| server | `npm run seed` | **Reinicia la BD** y crea 5 cuentas + 9 movimientos de prueba |
| client | `npm run dev` | Servidor de desarrollo de Vite |
| client | `npm run build` | Compila el frontend para producción en `client/dist` |
| client | `npm run preview` | Sirve la compilación de producción |
| client | `npm run lint` | Analiza el código con ESLint |

---

## ⚙️ Variables de entorno

### `server/.env`

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `4000` | Puerto en el que escucha la API |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/banco_simplificado` | Cadena de conexión a MongoDB local (la BD se crea sola) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origen permitido por CORS (URL del frontend) |

### `client/.env` (opcional)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base de la API. Con `/api` se usa el proxy de Vite. Si sirves el frontend aparte, pon la URL completa (ej. `http://localhost:4000/api`) |

---

## 🌱 Datos de prueba (seed)

`npm run seed` **borra** las colecciones `cuentas` y `transacciones` y crea:

| N.º de cuenta | Titular | Saldo inicial (PEN) |
|---|---|---|
| 1001 | Ana Torres Quispe | 2,500.00 |
| 1002 | Luis Ramírez Huamán | 1,200.50 |
| 1003 | María Fernández Rojas | 830.75 |
| 1004 | Jorge Castillo Mendoza | 50.00 |
| 1005 | Carla Vargas Paredes | 0.00 |

También registra 9 movimientos históricos (depósitos, retiros y transferencias) que cuadran con los saldos. Puedes ejecutarlo cuantas veces quieras para volver al estado inicial antes de una demostración.

---

## 🔌 API REST

URL base: `http://localhost:4000/api`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/cuenta/:id` | Obtiene saldo y datos de la cuenta (`:id` = número de cuenta) |
| `POST` | `/cuenta/deposito` | Registra un depósito |
| `POST` | `/cuenta/retiro` | Registra un retiro |
| `POST` | `/cuenta/transferencia` | Registra una transferencia entre cuentas |
| `GET` | `/cuenta/:id/historial` | Últimas transacciones. Query opcional: `?limite=20` (1-100), `?tipo=DEPOSITO\|RETIRO\|TRANSFERENCIA` |
| `GET` | `/cuenta` | *(Extra)* Lista todas las cuentas, para el selector del frontend |
| `GET` | `/health` | *(Extra)* Estado de la API y de la conexión a MongoDB |

### Cuerpos de petición

```jsonc
// POST /api/cuenta/deposito   y   POST /api/cuenta/retiro
{ "numeroCuenta": "1001", "monto": 150.50, "descripcion": "opcional" }

// POST /api/cuenta/transferencia
{ "cuentaOrigen": "1001", "cuentaDestino": "1002", "monto": 75, "descripcion": "opcional" }
```

### Ejemplo de respuesta exitosa (`201 Created`)

```json
{
  "ok": true,
  "mensaje": "Retiro realizado con éxito",
  "cuenta": { "numeroCuenta": "1001", "titular": "Ana Torres Quispe", "moneda": "PEN", "saldo": 2349.5 },
  "transaccion": { "tipo": "RETIRO", "monto": 150.5, "cuentaOrigen": "1001", "cuentaDestino": null, "fecha": "2026-11-09T20:15:43.085Z" }
}
```

### Códigos de estado HTTP

| Código | Cuándo |
|---|---|
| `200` | Consulta correcta (saldo, historial) |
| `201` | Operación registrada (depósito, retiro, transferencia) |
| `400` | Datos inválidos (monto ≤ 0, más de 2 decimales, cuenta mal formada, JSON inválido), **saldo insuficiente** o transferencia a la misma cuenta |
| `404` | Cuenta (origen o destino) no encontrada, o ruta inexistente |
| `500` | Error interno del servidor |

Los errores siempre tienen la forma `{ "ok": false, "error": "mensaje descriptivo" }`.

### Probar con cURL

```bash
curl http://localhost:4000/api/cuenta/1001
curl -X POST http://localhost:4000/api/cuenta/deposito -H "Content-Type: application/json" -d "{\"numeroCuenta\":\"1001\",\"monto\":100}"
curl -X POST http://localhost:4000/api/cuenta/retiro -H "Content-Type: application/json" -d "{\"numeroCuenta\":\"1004\",\"monto\":999}"   # → 400 saldo insuficiente
curl -X POST http://localhost:4000/api/cuenta/transferencia -H "Content-Type: application/json" -d "{\"cuentaOrigen\":\"1001\",\"cuentaDestino\":\"9999\",\"monto\":10}"   # → 404
curl "http://localhost:4000/api/cuenta/1001/historial?limite=5"
```

---

## 🔒 Decisiones técnicas destacadas

### Integridad del saldo (nunca negativo)
Los retiros y débitos usan una **actualización atómica condicional** en MongoDB:

```js
Cuenta.findOneAndUpdate(
  { numeroCuenta, saldoCentimos: { $gte: monto } },  // solo si hay fondos
  { $inc: { saldoCentimos: -monto } }
);
```

La comprobación y el descuento ocurren en **una sola operación** del motor, así que dos retiros simultáneos no pueden dejar la cuenta en negativo. Se probó con 40 retiros concurrentes de S/ 30 sobre un saldo de S/ 830.75: se aceptaron exactamente 27 y se rechazaron 13 con `400` (saldo final S/ 20.75).

### Transferencias atómicas
- Si MongoDB corre como **replica set**, la transferencia usa una **transacción ACID** (`session.withTransaction`): débito, crédito y registro se confirman juntos o no se confirma nada.
- En una instalación **standalone** (la habitual en local, que no admite transacciones) se usan actualizaciones atómicas condicionales con **compensación**: si un paso posterior falla, los pasos anteriores se revierten automáticamente.

El modo se detecta solo al arrancar y se muestra en la consola.

### Dinero en céntimos
Los montos se guardan en MongoDB como **enteros en céntimos** (`saldoCentimos`, `montoCentimos`) para evitar errores de coma flotante (`0.1 + 0.2 ≠ 0.3`). La API recibe y devuelve siempre unidades monetarias (ej. `150.75`).

### Frontend
- **Componentes modulares** que se comunican por *props* y *callbacks* (`onOperar`, `onCambiarCuenta`, `onRefrescar`).
- **`useState`** para formularios controlados, la cuenta activa, el saldo, el historial, la carga y los errores.
- **`useEffect`** para cargar las cuentas al iniciar y para sincronizar saldo e historial cuando cambia la cuenta o tras cada operación, con `AbortController` para cancelar peticiones obsoletas.
- El saldo se actualiza **al instante** con la respuesta de la API y después se resincroniza con MongoDB, **sin recargar la página**.
- Retroalimentación visual: validación en vivo de los formularios, *skeletons* de carga, botones con *spinner*, notificaciones de éxito y error, y animación del saldo cuando cambia.
- **100 % Tailwind CSS** (v4, integrado con `@tailwindcss/vite`) y diseño *responsive* (móvil → escritorio).

---

## 🎬 Guion sugerido para la demostración

1. `npm run seed` → mostrar las cuentas creadas en consola (o en MongoDB Compass, BD `banco_simplificado`).
2. Abrir `http://localhost:5173`, elegir la cuenta **1001** y revisar saldo e historial.
3. **Depositar** S/ 100: el saldo y el historial se actualizan al momento.
4. **Retirar** desde la cuenta **1004** un monto mayor a S/ 50: aparece el error de saldo insuficiente (400).
5. **Transferir** de 1001 a 1005 → cambiar a la cuenta 1005 y ver la *transferencia recibida*.
6. Transferir a una cuenta inexistente (ej. 9999) → error 404.
7. Mostrar los documentos en las colecciones `cuentas` y `transacciones` de MongoDB.

---

## 🛠️ Solución de problemas

| Problema | Solución |
|---|---|
| `No se pudo conectar a MongoDB` | Inicia el servicio de MongoDB (Windows: `net start MongoDB`) y revisa `MONGODB_URI` |
| El frontend muestra "No hay conexión con la API" | Comprueba que `npm run dev` siga corriendo en `/server` (puerto 4000) |
| "No hay cuentas registradas" | Ejecuta `npm run seed` en `/server` |
| Puerto 4000 o 5173 ocupado | Cambia `PORT` en `server/.env`. Para Vite: `npm run dev -- --port 5174` |
