# Backend Serverless - Instrucciones de Deploy (CatFecito)

Esta es la **versión 2.0** del backend, migrada de Express.js/PostgreSQL a **AWS Lambda + DynamoDB**.

> **Nota histórica**: Si buscas la versión original PERN, consulta `LEGACY_BACKEND_INSTRUCTIONS.md` o el branch `legacy/pern-stack`.

## 🎯 Arquitectura Actual

```
AWS Lambda Functions (Node.js 20.x)
       ↓
   API Gateway
       ↓
   DynamoDB (Base de datos NoSQL)
       ↓
   S3 (Imágenes de productos)
```

**Patrón de diseño**: Repository → Service → Handler (3 capas)

## Requisitos

- Node.js >= 20.x
- npm o yarn
- AWS CLI configurado
- Serverless Framework (`npm install -g serverless`)
- Cuenta de AWS con permisos suficientes
- Cuenta de MercadoPago (para pagos)

## 1) Configurar AWS Credentials

```bash
# Instalar AWS CLI
# Windows: https://aws.amazon.com/cli/
# macOS: brew install awscli
# Linux: sudo apt install awscli

# Configurar credenciales
aws configure
```

Ingresa:

- AWS Access Key ID
- AWS Secret Access Key
- Default region name (ej: `us-east-1`)
- Default output format: `json`

## 2) Variables de entorno

Crea un archivo `.env` en `server/` con este contenido:

```env
# AWS
AWS_REGION=us-east-1
DYNAMODB_TABLE=catfecito-serverless-dev

# JWT
JWT_SECRET=tu_secreto_jwt_superseguro_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# URLs
CLIENT_URL=http://localhost:5173
BACKEND_URL=https://tu-api-id.execute-api.us-east-1.amazonaws.com/dev

# MercadoPago
MP_ACCESS_TOKEN=tu_mercadopago_access_token
MP_PUBLIC_KEY=tu_mercadopago_public_key
CURRENCY_ID=ARS

# Bcrypt
BCRYPT_ROUNDS=10
```

**Importante**: Cambiarás `BACKEND_URL` después del primer deploy.

## 3) Instalar dependencias

```bash
cd server
npm install
```

## 4) Desplegar en AWS

```bash
# Deploy completo (primera vez)
serverless deploy

# Deploy de una sola función (más rápido)
serverless deploy function -f nombreFuncion
```

El output mostrará:

```
endpoints:
  POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/api/auth/register
  POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/api/auth/login
  ...

functions:
  register: catfecito-serverless-dev-register
  login: catfecito-serverless-dev-login
  ...
```

**Copia la URL base** (ej: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`) y actualiza `BACKEND_URL` en `.env`.

## 5) Estructura de DynamoDB

La tabla usa **Single Table Design**:

```
PK (Partition Key) | SK (Sort Key)       | Entidad
-------------------|---------------------|----------
USER#<uuid>        | METADATA            | Usuario
PRODUCT#<uuid>     | METADATA            | Producto
CATEGORY#<slug>    | METADATA            | Categoría
ORDER#<uuid>       | METADATA            | Orden
ORDER#<uuid>       | ITEM#<product_id>   | Item de orden
USER#<uuid>        | CART#<product_id>   | Item de carrito
USER#<uuid>        | ORDER#<order_id>    | Índice de órdenes
```

**GSI1**: `GSI1PK` + `GSI1SK` (para queries inversas)  
**GSI2**: `GSI2PK` + `GSI2SK` (para búsquedas por nombre)

## 6) Endpoints principales

### Auth

```bash
# Registro
POST /api/auth/register
Body: { "name": "Juan", "email": "juan@mail.com", "password": "Pass123" }

# Login
POST /api/auth/login
Body: { "email": "juan@mail.com", "password": "Pass123" }

# Verificar token
GET /api/auth/verify
Headers: Authorization: Bearer <token>
```

### Products (público)

```bash
GET /api/products
GET /api/products/{id}
GET /api/products/category/{category_id}
```

### Admin (requiere token de admin)

```bash
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}
PATCH  /api/admin/products/{id}/status

GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/{id}
...
```

### Cart (requiere token de usuario)

```bash
GET    /api/users/cart
POST   /api/users/cart
PUT    /api/users/cart/{product_id}
DELETE /api/users/cart/{product_id}
DELETE /api/users/cart
```

### Orders

```bash
POST   /api/users/orders
GET    /api/users/orders
GET    /api/users/orders/{id}
PATCH  /api/users/orders/{id}/cancel

# Admin
GET    /api/admin/orders
GET    /api/admin/orders/{id}
PATCH  /api/admin/orders/{id}/status
```

### Payments

```bash
POST /api/payments/create-preference
Body: { "order_id": "uuid-order" }

GET  /api/payments/status/{order_id}
POST /api/payments/webhook (usado por MercadoPago)
```

## 7) Crear el primer usuario administrador

### Opción A: Registrar y promover manualmente

1. Registra un usuario desde la API:

```bash
# curl (macOS/Linux)
curl -X POST https://tu-api.execute-api.us-east-1.amazonaws.com/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@ejemplo.com","password":"AdminPass123"}'

# PowerShell (Windows)
$body = @{name='Admin';email='admin@ejemplo.com';password='AdminPass123'} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri https://tu-api.execute-api.us-east-1.amazonaws.com/dev/api/auth/register -Body $body -ContentType 'application/json'
```

2. Ve a **AWS Console → DynamoDB → Tables → tu-tabla → Items**

3. Busca el item con:
   - `PK` = `USER#<uuid>`
   - `SK` = `METADATA`
   - `email` = `admin@ejemplo.com`

4. Edita el campo `role` y cámbialo de `user` a `admin`

5. Guarda cambios

### Opción B: Script de inicialización (próximamente)

Agregaremos un comando `npm run create-admin` que lo hará automáticamente.

## 8) Configurar Webhooks de MercadoPago

Para recibir notificaciones de pagos en desarrollo:

1. **Instala ngrok** (túnel público):

   ```bash
   # macOS
   brew install ngrok/ngrok/ngrok

   # Windows/Linux: descarga desde https://ngrok.com/download
   ```

2. **Autentica ngrok**:

   ```bash
   ngrok config add-authtoken <tu-token>
   ```

3. **Expón tu API Gateway**:

   ```bash
   ngrok http https://tu-api.execute-api.us-east-1.amazonaws.com --host-header=rewrite
   ```

   > Nota: ngrok te dará una URL como `https://xxxx.ngrok.io`

4. **Configura en MercadoPago**:
   - Ve a tu cuenta de MercadoPago → Webhooks
   - Agrega: `https://xxxx.ngrok.io/dev/api/payments/webhook`

5. **Actualiza `.env`**:

   ```env
   BACKEND_URL=https://xxxx.ngrok.io/dev
   ```

6. **Re-despliega**:
   ```bash
   serverless deploy
   ```

## 9) Ver logs en tiempo real

```bash
# Logs de una función específica
serverless logs -f register -t

# Todos los logs
serverless logs -t

# O desde AWS Console
AWS Console → CloudWatch → Log groups → /aws/lambda/catfecito-*
```

## 10) Comandos útiles

```bash
# Deploy completo
serverless deploy

# Deploy de una función
serverless deploy function -f login

# Ver información del stack
serverless info

# Eliminar todo (¡cuidado!)
serverless remove

# Invocar función localmente (con payload)
serverless invoke local -f register --data '{"body":"{\"email\":\"test@test.com\"}"}'

# Ver métricas
serverless metrics
```

## 11) Estructura del código

```
server/
├── functions/          # Handlers (orquestación)
│   ├── auth/
│   ├── products/
│   ├── categories/
│   ├── users/
│   ├── admin/
│   └── payments/
├── services/           # Lógica de negocio
│   ├── auth.service.js
│   ├── product.service.js
│   ├── category.service.js
│   ├── cart.service.js
│   ├── order.service.js
│   ├── payment.service.js
│   └── admin/
├── repositories/       # Acceso a datos (DynamoDB)
│   ├── user.repository.js
│   ├── product.repository.js
│   ├── category.repository.js
│   ├── cart.repository.js
│   └── order.repository.js
├── utils/              # Utilidades
│   ├── auth.js         # Middlewares JWT
│   ├── responses.js    # Respuestas HTTP
│   ├── validators.js   # Validaciones
│   └── helpers.js      # Funciones auxiliares
├── libs/               # Integraciones
│   └── mercadopago.js
├── dynamodb.js         # Cliente DynamoDB
└── serverless.yml      # Configuración infra
```

## 12) Arquitectura en capas

**Handler (Controller)**

```javascript
// Solo orquesta y maneja HTTP
const loginHandler = async (event) => {
  const body = parseBody(event);
  const result = await authService.login(body);
  return success(result);
};
```

**Service (Business Logic)**

```javascript
// Lógica de negocio
class AuthService {
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    // validaciones, bcrypt, JWT, etc.
    return { token, user };
  }
}
```

**Repository (Data Access)**

```javascript
// Acceso a DynamoDB
class UserRepository {
  async findByEmail(email) {
    const result = await docClient.send(new QueryCommand({...}));
    return result.Items[0];
  }
}
```

## Problemas comunes

### Error: "Missing credentials in config"

```bash
aws configure
# Verifica que ~/.aws/credentials existe
```

### Error: "Stack with id does not exist"

```bash
# Primera vez: usa deploy completo
serverless deploy
```

### Error: "Rate exceeded" en DynamoDB

- Ajusta la capacidad en `serverless.yml`:
  ```yaml
  ProvisionedThroughput:
    ReadCapacityUnits: 5
    WriteCapacityUnits: 5
  ```

### Webhook no recibe notificaciones

- Verifica que ngrok esté corriendo
- Revisa CloudWatch Logs
- Confirma la URL en el panel de MercadoPago

## Costos estimados (AWS Free Tier)

- **Lambda**: 1M requests/mes gratis
- **DynamoDB**: 25 GB storage gratis + 25 WCU/RCU
- **API Gateway**: 1M requests/mes gratis (primer año)
- **S3**: 5 GB storage gratis

**Estimado mensual después de Free Tier**: $5-15 USD (tráfico bajo/medio)

## Seguridad

- ✅ JWT con secret fuerte
- ✅ Variables en `.env` (nunca en el código)
- ✅ CORS configurado por dominio
- ✅ Rate limiting en API Gateway
- ✅ Validaciones en todos los endpoints
- ✅ Roles de IAM mínimos necesarios

## Próximos pasos

- [ ] CI/CD con GitHub Actions
- [ ] Tests unitarios e integración
- [ ] Monitoreo con AWS X-Ray
- [ ] CDN con CloudFront
- [ ] Imágenes en S3 con CloudFront

---

**Migración desde PERN**: Consulta `docs/MIGRATION_GUIDE.md` para entender los cambios arquitectónicos.
