# Frontend v2 - Instrucciones (CatFecito)

Esta guia documenta el frontend actual (arquitectura por features + shared + app) y reemplaza la guia operativa anterior.

Documento legacy conservado: `LEGACY_FRONTEND_INSTRUCTIONS.md`.

## 1) Requisitos

- Node.js >= 18
- npm >= 9
- Backend desplegado y accesible (local o AWS API Gateway)

## 2) Ubicacion del frontend

El frontend vive en:

```text
client/
```

## 3) Instalacion

Desde la raiz del repo:

```bash
cd client
npm install
```

## 4) Variables de entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

2. Ajusta los valores en `.env`:

- `VITE_BACKEND_URL`: URL base del backend (ejemplo local: `http://localhost:5000`)
- `VITE_MP_PUBLIC_KEY`: public key de MercadoPago
- `VITE_APP_NAME`: nombre visible de la app

Nota: el cliente HTTP usa `VITE_BACKEND_URL` en `src/config/apiClient.js`.

## 5) Scripts disponibles

Ejecutar en desarrollo:

```bash
npm run dev
```

Build de produccion:

```bash
npm run build
```

Preview del build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## 6) Estructura de arquitectura (v2)

```text
client/src/
  app/                 # Composicion global (App, routes, providers)
  features/            # Modulos por dominio (auth, products, cart, orders, profile, admin)
  shared/              # Reuso transversal (components, hooks, utils, constants, types)
  config/              # Config global de cliente/API
  services/            # Servicios generales (si aplican)
  pages/               # Paginas legacy o de transicion
  styles/              # Estilos globales
```

## 7) Convenciones de la capa frontend

- Navegacion del cliente en `src/shared/constants/routes.constants.js`.
- Endpoints de API centralizados en `src/config/apiEndpoints.js`.
- HTTP client con interceptores en `src/config/apiClient.js`.
- Estado global con Zustand en `src/features/*/stores`.
- Logica de negocio en `src/features/*/services`.
- Logica de UI reutilizable en `src/features/*/hooks` y `src/shared/hooks`.
- Providers globales en `src/app/providers`.

## 8) Flujo recomendado de desarrollo

1. Define rutas de navegacion (si aplica) en constantes compartidas.
2. Define o ajusta endpoints en configuracion centralizada.
3. Implementa servicio por feature.
4. Conecta servicio a store/hook del feature.
5. Consume el hook/store desde componentes.
6. Ejecuta `npm run lint` y corrige advertencias relevantes.
7. Valida flujo manual en navegador con backend real.

## 9) Integracion con backend serverless

- Asegura que `VITE_BACKEND_URL` apunte al stage correcto de API Gateway.
- Si hay errores CORS, valida la configuracion del backend en `serverless.yml`.
- Verifica que los tokens se guarden con las keys definidas en `src/shared/constants/storage.constants.js`.

## 10) Troubleshooting rapido

Si las requests van a localhost por error:

- Revisa `.env` y confirma `VITE_BACKEND_URL`.
- Reinicia `npm run dev` despues de cambiar variables.

Si aparece `401` en endpoints protegidos:

- Verifica `authToken` y `refreshToken` en localStorage.
- Revisa el interceptor de refresh en `src/config/apiClient.js`.

Si falla build/lint por imports:

- Verifica rutas movidas tras el refactor a `features/` y `shared/`.
- Revisa exports en los `index.js` (barrels) del modulo.

## 11) Relacion con documentacion legacy

- Documento actual (v2): `FRONTEND_INSTRUCTIONS.md`
- Documento historico (v1): `LEGACY_FRONTEND_INSTRUCTIONS.md`

Usa la guia legacy solo para referencia historica o comparacion.