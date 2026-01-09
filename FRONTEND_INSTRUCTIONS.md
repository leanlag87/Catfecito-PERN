# Frontend — Instrucciones para levantar el proyecto (CatFecito)

Estas instrucciones asumen que levantarás el frontend que está en `catfecito-react/CatFecito`.

## Requisitos

- Node.js >= 18
- npm o yarn
- Terminal (PowerShell para Windows, Terminal/Bash para macOS/Linux)

## 1) Instalar dependencias

### Windows (PowerShell):

```powershell
cd catfecito-react\CatFecito; npm install
```

### macOS/Linux (Terminal/Bash):

```bash
cd catfecito-react/CatFecito && npm install
```

## 2) Variables/URL del backend

El frontend espera que el backend esté en `http://localhost:5000` por defecto (ver `server/.env` en el backend). Si cambias el puerto del backend, actualiza las llamadas en el código (o define `VITE_API_URL` si lo agregas).

## 3) Ejecutar en desarrollo

### Windows (PowerShell):

```powershell
cd catfecito-react\CatFecito; npm run dev
```

### macOS/Linux (Terminal/Bash):

```bash
cd catfecito-react/CatFecito && npm run dev
```

Por defecto Vite abrirá el sitio en http://localhost:5173 o imprimirá el URL en la consola.

## 4) Build para producción

### Windows (PowerShell):

```powershell
cd catfecito-react\CatFecito; npm run build
```

### macOS/Linux (Terminal/Bash):

```bash
cd catfecito-react/CatFecito && npm run build
```

La carpeta `dist/` contendrá los artefactos para servir en un servidor estático.

## 5) Registrar usuario/admin desde el frontend

- Puedes usar el formulario de registro del frontend (ruta Register) para crear usuarios.
- Para convertir un usuario en admin necesitas un admin existente (ver `BACKEND_INSTRUCTIONS.md`).

## 6) Notas útiles

- Si el frontend no encuentra el backend, revisa CORS y la variable `CLIENT_URL` en `server/.env`.
- El paquete usa Vite + React; los scripts útiles están en `package.json` dentro de `catfecito-react/CatFecito`.
