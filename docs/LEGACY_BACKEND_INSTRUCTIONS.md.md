# Backend — Instrucciones para levantar el proyecto (CatFecito)

Sigue estos pasos para instalar, configurar y ejecutar el backend en desarrollo.

## Requisitos

- Node.js >= 18
- npm o yarn
- PostgreSQL (local o remoto)
- Terminal (PowerShell para Windows, Terminal/Bash para macOS/Linux)

## 1) Variables de entorno

Crea un archivo `.env` en `server/` con este contenido (ajusta según tu entorno):

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=catfecito_pern
DB_USER=postgres
DB_PASSWORD=tu_password_postgres
JWT_SECRET=tu_secreto_jwt_superseguro
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
BCRYPT_ROUNDS=10
```

Guárdalo como `server/.env`.

## 2) Instalar dependencias

### Windows (PowerShell):

```powershell
cd server; npm install
```

### macOS/Linux (Terminal/Bash):

```bash
cd server && npm install
```

## 3) Crear la base de datos e inicializar esquema

### Windows (PowerShell):

1. Crea la base de datos usando psql (o tu cliente favorito):

```powershell
# Con psql (ejecutar desde PowerShell)
psql -U postgres -c "CREATE DATABASE catfecito_pern;"

# Si tu usuario/puerto difieren, añade -h <host> -p <port> -U <user>
```

2. Ejecuta el script de inicialización (`server/database/init.sql`):

```powershell
psql -U postgres -d catfecito_pern -f .\server\database\init.sql
```

### macOS/Linux (Terminal/Bash):

1. Crea la base de datos usando psql:

```bash
# Con psql
psql -U postgres -c "CREATE DATABASE catfecito_pern;"

# Si tu usuario/puerto difieren, añade -h <host> -p <port> -U <user>
```

2. Ejecuta el script de inicialización (`server/database/init.sql`):

```bash
psql -U postgres -d catfecito_pern -f ./server/database/init.sql
```

Esto crea tablas, tipos ENUM, índices y algunas semillas de categorías.

## 4) Ejecutar el servidor en desarrollo

### Windows (PowerShell):

```powershell
cd server; npm run dev
```

### macOS/Linux (Terminal/Bash):

```bash
cd server && npm run dev
```

El backend por defecto corre en http://localhost:5000 (puedes cambiarlo en `.env`).

## 5) Endpoints útiles

- Registro: POST /api/auth/register (body: { name, email, password })
- Login: POST /api/auth/login (body: { email, password })
- Perfil: GET /api/users/profile (requiere Authorization: Bearer <token>)

Rutas administrativas (requieren token de un usuario con role='admin'):

- GET /api/users
- PUT /api/users/:id/role (body: { role: 'admin' | 'user' })
- PATCH /api/users/:id/status

> Las rutas están en `server/src/router` y los controladores en `server/src/controllers`.

## 6) Cómo crear el primer usuario administrador

Opción A — Usando el panel web y query manual

1. Regístrate como usuario desde la página web (formulario de registro).
2. Ingresa a tu herramienta de administración de base de datos (ej. pgAdmin, DBeaver, Azure Data Studio, etc.).
3. Ejecuta el siguiente query para promover el usuario a admin (reemplaza el email si usaste otro):
   ```sql
   UPDATE users SET role = 'admin' WHERE lower(email) = lower('admin@ejemplo.local');
   ```
   Esto convierte el usuario registrado en administrador.

Opción B —

1. Registra un usuario usando la API:

**Windows (PowerShell / Invoke-RestMethod):**

```powershell
$body = @{ name = 'Admin Inicial'; email = 'admin@ejemplo.local'; password = 'AdminPass123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/register -Body $body -ContentType 'application/json'
```

**macOS/Linux (Terminal / curl):**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin Inicial","email":"admin@ejemplo.local","password":"AdminPass123"}'
```

2. Conéctate a la DB y convierte al usuario en admin:

**Windows (PowerShell):**

```powershell
psql -U postgres -d catfecito_pern -c "UPDATE users SET role = 'admin' WHERE lower(email) = lower('admin@ejemplo.local');"
```

**macOS/Linux (Terminal/Bash):**

```bash
psql -U postgres -d catfecito_pern -c "UPDATE users SET role = 'admin' WHERE lower(email) = lower('admin@ejemplo.local');"
```

Opción C — Insertar directamente (cuando la base de datos está vacía)

1. Genera un hash de contraseña con bcrypt en tu máquina (ejemplo con Node.js):

**Windows (PowerShell):**

```powershell
# Crear archivo temporal para generar hash
Set-Content -Path .\hash.js -Value "const bcrypt = require('bcrypt'); bcrypt.hash(process.argv[2], 10).then(h=>console.log(h));"
node .\hash.js "AdminPass123" > .\hash.txt
Get-Content .\hash.txt
```

**macOS/Linux (Terminal/Bash):**

```bash
# Crear archivo temporal para generar hash
echo "const bcrypt = require('bcrypt'); bcrypt.hash(process.argv[2], 10).then(h=>console.log(h));" > hash.js
node hash.js "AdminPass123" > hash.txt
cat hash.txt
```

2. Copia el hash y ejecuta un INSERT en la DB (reemplaza el hash):

```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin Inicial', 'admin@ejemplo.local', '<PEGA_HASH_AQUI>', 'admin');
```

Puedes ejecutar la sentencia SQL con psql:

**Windows (PowerShell):**

```powershell
psql -U postgres -d catfecito_pern -c "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin Inicial','admin@ejemplo.local','<HASH>', 'admin');"
```

**macOS/Linux (Terminal/Bash):**

```bash
psql -U postgres -d catfecito_pern -c "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin Inicial','admin@ejemplo.local','<HASH>', 'admin');"
```

Opción D — Si ya hay un admin en otra instancia

- Registra una cuenta normalmente y pide a ese admin que use la ruta PUT /api/users/:id/role para promoverla.

## Notas de seguridad

- Nunca expongas el `JWT_SECRET` ni las credenciales de DB públicamente.
- Cambia la contraseña del admin después del primer login.

## Debug y problemas comunes

- Si `psql` no está en el PATH, usa el cliente que tengas o abre la terminal de PostgreSQL.
- Si al iniciar el servidor falla la conexión a la DB revisa `server/.env` y que el servicio PostgreSQL esté ejecutándose.

---

Archivo relacionado: `server/database/init.sql` (esquema y seeds).

---

## 7) Exponer el backend con ngrok (webhooks, pruebas externas)

ngrok permite crear una URL pública temporal que redirige a tu servidor local, útil para pruebas de webhooks (ej. MercadoPago) o acceso externo.

### Pasos para usar ngrok en Windows

1. **Instala ngrok:**

   - Descarga desde https://ngrok.com/download
   - Extrae el ejecutable y colócalo en una carpeta accesible (ej. `C:\ngrok`)
   - (Opcional) Agrega la carpeta a tu PATH para usarlo desde cualquier terminal.

2. **Crea una cuenta y copia tu authtoken:**

   - Regístrate en https://ngrok.com/
   - Ve a tu panel de usuario y copia el `authtoken`.
   - Ejecuta en PowerShell:
     ```powershell
     .\ngrok.exe config add-authtoken <TU_AUTHTOKEN>
     ```

3. **Levanta el backend normalmente:**

   ```powershell
   cd server; npm run dev
   ```

4. **Ejecuta ngrok apuntando al puerto del backend (por defecto 5000):**

   ```powershell
   .\ngrok.exe http 5000
   ```

   - ngrok mostrará una URL pública HTTPS (ej. `https://xxxx.ngrok.io`) que redirige a tu backend local
   - pega la URL publica en /server/.env en el campo BACKEND_URL=

5. **Usa la URL pública para webhooks o pruebas externas:**
   - Configura la URL en MercadoPago, Stripe, etc. para recibir notificaciones en desarrollo.
   - Puedes ver el tráfico y reintentar peticiones en http://127.0.0.1:4040

> Tip: Puedes automatizar ngrok con un script npm agregando en `server/package.json`:
>
> ```json
> "scripts": {
>   "ngrok": "ngrok http 5000"
> }
> ```
>
> Así puedes ejecutar:
>
> ```powershell
> npm run ngrok
> ```

### Pasos para usar ngrok en macOS/Linux

1. **Instala ngrok:**

   **macOS (Homebrew):**

   ```bash
   brew install ngrok/ngrok/ngrok
   ```

   **Linux (descarga manual):**

   ```bash
   # Descarga el archivo desde https://ngrok.com/download
   # Ejemplo para Linux (64-bit):
   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
   tar xvzf ngrok-v3-stable-linux-amd64.tgz
   sudo mv ngrok /usr/local/bin/
   ```

2. **Crea una cuenta y copia tu authtoken:**

   - Regístrate en https://ngrok.com/
   - Ve a tu panel de usuario y copia el `authtoken`.
   - Ejecuta en Terminal:
     ```bash
     ngrok config add-authtoken <TU_AUTHTOKEN>
     ```

3. **Levanta el backend normalmente:**

   ```bash
   cd server && npm run dev
   ```

4. **Ejecuta ngrok apuntando al puerto del backend (por defecto 5000):**

   ```bash
   ngrok http 5000
   ```

   - ngrok mostrará una URL pública HTTPS (ej. `https://xxxx.ngrok.io`) que redirige a tu backend local
   - pega la URL publica en /server/.env en el campo BACKEND_URL=

5. **Usa la URL pública para webhooks o pruebas externas:**
   - Configura la URL en MercadoPago, Stripe, etc. para recibir notificaciones en desarrollo.
   - Puedes ver el tráfico y reintentar peticiones en http://127.0.0.1:4040

> Tip: Puedes automatizar ngrok con un script npm agregando en `server/package.json`:
>
> ```json
> "scripts": {
>   "ngrok": "ngrok http 5000"
> }
> ```
>
> Así puedes ejecutar:
>
> ```bash
> npm run ngrok
> ```

---
