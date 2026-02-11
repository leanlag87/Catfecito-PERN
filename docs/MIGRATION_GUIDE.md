# Guía de Migración: PERN Stack → AWS Serverless

Esta guía documenta el proceso de migración de **CatFecito** desde una arquitectura tradicional **PERN** (PostgreSQL + Express + React + Node.js) hacia una arquitectura **serverless completamente escalable** con servicios de AWS.

## 📊 Resumen Ejecutivo

| Aspecto            | PERN (v1.0)             | AWS Serverless (v2.0)                 |
| ------------------ | ----------------------- | ------------------------------------- |
| **Backend**        | Express.js monolítico   | AWS Lambda (funciones independientes) |
| **Base de datos**  | PostgreSQL (relacional) | DynamoDB (NoSQL)                      |
| **Servidor**       | EC2/VPS 24/7            | Sin servidores (serverless)           |
| **Escalabilidad**  | Vertical (+ CPU/RAM)    | Horizontal (automática)               |
| **Costo base**     | ~$20-50/mes             | $0 en reposo, pago por uso            |
| **Deploy**         | SSH + PM2/Docker        | `serverless deploy`                   |
| **Disponibilidad** | Single point of failure | Multi-AZ (99.99% SLA)                 |

---

## 🎯 Motivación de la Migración

### Problemas del stack PERN original:

1. **Costo fijo**: Servidor corriendo 24/7 aunque no haya tráfico
2. **Escalabilidad manual**: Requería intervención para manejar picos de tráfico
3. **Mantenimiento**: Actualizaciones de SO, seguridad, patches
4. **Single point of failure**: Si el servidor caía, toda la app se caía
5. **Backup manual**: PostgreSQL requería backups programados

### Beneficios de AWS Serverless:

✅ **Pago por uso real**: $0 cuando no hay requests  
✅ **Escalado automático**: Lambda escala de 0 a 1000+ instancias  
✅ **Alta disponibilidad**: Infraestructura multi-región  
✅ **Mantenimiento cero**: AWS gestiona servidores, SO, seguridad  
✅ **Backups automáticos**: DynamoDB con Point-in-Time Recovery

---

## 🏗️ Cambios Arquitectónicos

### 1. Backend: Express → Lambda Functions

#### **ANTES (Express monolítico)**

```javascript
// server.js
const express = require("express");
const app = express();

app.post("/api/auth/register", authController.register);
app.post("/api/auth/login", authController.login);
app.get("/api/products", productController.getAll);
// ... 50+ rutas en un solo proceso

app.listen(3000);
```

**Problemas**:

- Todo el código en un solo proceso
- Un error tumba toda la aplicación
- Difícil de escalar partes específicas

#### **DESPUÉS (AWS Lambda)**

```javascript
// functions/auth/register.js
export const register = requireAuth(async (event) => {
  const result = await authService.register(parseBody(event));
  return success(result, 201);
});

// functions/auth/login.js
export const login = async (event) => {
  const result = await authService.login(parseBody(event));
  return success(result);
};
```

**Ventajas**:

- Cada función es independiente
- Escalan y fallan de forma aislada
- Despliegue granular (función por función)

---

### 2. Base de Datos: PostgreSQL → DynamoDB

#### **ANTES (PostgreSQL - Relacional)**

```sql
-- Tablas con relaciones
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  category_id INT REFERENCES categories(id),
  price DECIMAL(10,2),
  stock INT
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total DECIMAL(10,2),
  status VARCHAR(20)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity INT
);
```

**Queries con JOINs**:

```sql
-- Obtener orden con items
SELECT o.*, oi.*, p.name, p.price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.user_id = ?;
```

#### **DESPUÉS (DynamoDB - NoSQL)**

**Single Table Design**:

```
PK                  | SK                    | Atributos
--------------------|----------------------|------------------
USER#uuid           | METADATA             | name, email, role
PRODUCT#uuid        | METADATA             | name, price, stock
ORDER#uuid          | METADATA             | user_id, total, status
ORDER#uuid          | ITEM#product_uuid    | quantity, price
USER#uuid           | CART#product_uuid    | quantity
USER#uuid           | ORDER#order_uuid     | (índice)
```

**Query sin JOINs**:

```javascript
// Obtener orden con items (1 sola query)
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `ORDER#${orderId}`,
    },
  }),
);
// Retorna METADATA + todos los ITEM#* en 1 request
```

---

### 3. Autenticación: Sessions → JWT

#### **ANTES (Sessions en PostgreSQL)**

```javascript
// Crear sesión
app.post("/login", async (req, res) => {
  const user = await User.findByEmail(email);
  req.session.userId = user.id; // Almacenado en DB
  res.json({ user });
});

// Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  next();
};
```

**Problemas**:

- Sesiones en DB (writes costosos)
- Difícil de escalar horizontalmente
- Requiere sticky sessions en load balancers

#### **DESPUÉS (JWT stateless)**

```javascript
// Generar token
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: "7d" },
);

// Middleware
export const requireAuth = (handler) => async (event) => {
  const token = event.headers?.authorization?.replace("Bearer ", "");
  const decoded = jwt.verify(token, JWT_SECRET);
  event.user = decoded; // Inyectar usuario en evento
  return handler(event);
};
```

**Ventajas**:

- Sin estado en el backend (stateless)
- No requiere consultas a DB por autenticación
- Compatible con múltiples instancias Lambda

---

### 4. Almacenamiento de Imágenes: Local → S3

#### **ANTES (Filesystem local)**

```javascript
// Multer + filesystem
const upload = multer({ dest: "uploads/" });

app.post("/products", upload.single("image"), async (req, res) => {
  const imagePath = `/uploads/${req.file.filename}`;
  await Product.create({ ...data, image_url: imagePath });
});
```

**Problemas**:

- Imágenes en el mismo servidor de la app
- Backup manual necesario
- No escala horizontalmente

#### **DESPUÉS (AWS S3)**

```javascript
// Subir a S3
const s3Client = new S3Client({ region: AWS_REGION });

const uploadToS3 = async (buffer, filename) => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `products/${filename}`,
      Body: buffer,
      ContentType: "image/jpeg",
    }),
  );

  return `https://${BUCKET_NAME}.s3.amazonaws.com/products/${filename}`;
};
```

**Ventajas**:

- Almacenamiento ilimitado
- CDN con CloudFront (entrega rápida global)
- Backup automático y versionado

---

## 🔄 Proceso de Migración Paso a Paso

### Fase 1: Preparación (1-2 semanas)

#### 1.1 Análisis de esquema PostgreSQL

```bash
# Exportar esquema actual
pg_dump -s catfecito > schema.sql
```

#### 1.2 Diseño de modelo DynamoDB

Convertir tablas relacionales a **Single Table Design**:

**Ejemplo - Tabla `orders` + `order_items`**:

**PostgreSQL**:

```
orders (1) → order_items (N) → products (1)
```

**DynamoDB**:

```
PK: ORDER#uuid    | SK: METADATA      | total, status, user_id
PK: ORDER#uuid    | SK: ITEM#prod1    | quantity, price, product_name
PK: ORDER#uuid    | SK: ITEM#prod2    | quantity, price, product_name
```

#### 1.3 Mapeo de endpoints

| Express Route             | Lambda Function                        | Método |
| ------------------------- | -------------------------------------- | ------ |
| `POST /api/auth/register` | `functions/auth/register.js`           | POST   |
| `GET /api/products`       | `functions/products/getAllProducts.js` | GET    |
| `GET /api/products/:id`   | `functions/products/getProductById.js` | GET    |

---

### Fase 2: Implementación Backend (3-4 semanas)

#### 2.1 Configurar proyecto Serverless

```bash
npm install -g serverless
serverless create --template aws-nodejs
```

#### 2.2 Crear estructura en capas

```
server/
├── repositories/   # Capa de datos (DynamoDB)
├── services/       # Lógica de negocio
├── functions/      # Handlers (Lambda)
└── utils/          # Helpers
```

#### 2.3 Implementar por módulos

**Orden recomendado**:

1. ✅ Auth (register, login, verify)
2. ✅ Users (perfil)
3. ✅ Categories (CRUD)
4. ✅ Products (CRUD)
5. ✅ Cart (agregar, actualizar, eliminar)
6. ✅ Orders (crear, listar)
7. ✅ Payments (MercadoPago)
8. ✅ Admin (gestión)

#### 2.4 Migrar datos existentes

**Script de migración (ejemplo)**:

```javascript
// migrate-users.js
const { Pool } = require("pg");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

const pgPool = new Pool({ connectionString: process.env.PG_URL });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient());

async function migrateUsers() {
  // 1. Obtener usuarios de PostgreSQL
  const { rows } = await pgPool.query("SELECT * FROM users");

  // 2. Transformar a formato DynamoDB
  const items = rows.map((user) => ({
    PutRequest: {
      Item: {
        PK: `USER#${user.id}`,
        SK: "METADATA",
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password, // Ya está hasheado
        role: user.role,
        created_at: user.created_at.toISOString(),
      },
    },
  }));

  // 3. Insertar en DynamoDB (batch de 25)
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await dynamoClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: batch,
        },
      }),
    );
  }

  console.log(`✅ ${items.length} usuarios migrados`);
}

migrateUsers();
```

---

### Fase 3: Adaptación Frontend (1 semana)

#### 3.1 Actualizar URLs de API

**Antes**:

```javascript
const API_URL = "http://localhost:3000/api";
```

**Después**:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
// https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/api
```

#### 3.2 Manejo de errores AWS

```javascript
// Antes (Express)
axios.post("/api/login", data).catch((err) => {
  if (err.response.status === 401) {
    // Manejar...
  }
});

// Después (API Gateway)
axios.post("/api/login", data).catch((err) => {
  const status = err.response?.status;
  const message = err.response?.data?.message || "Error";
  // Mismo manejo, estructura compatible
});
```

---

### Fase 4: Testing y Validación (1 semana)

#### 4.1 Tests de integración

```javascript
// tests/integration/auth.test.js
describe("Auth Endpoints", () => {
  it("should register a new user", async () => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: "Test User",
      email: "test@example.com",
      password: "Test123!",
    });

    expect(response.status).toBe(201);
    expect(response.data.user).toHaveProperty("id");
  });
});
```

#### 4.2 Pruebas de carga

```bash
# Artillery
artillery quick --count 100 --num 10 https://api.catfecito.com/api/products
```

#### 4.3 Verificar logs

```bash
serverless logs -f getAllProducts -t --startTime 1h
```

---

### Fase 5: Despliegue y Cutover (3-5 días)

#### 5.1 Deploy a producción

```bash
# Crear stage de producción
serverless deploy --stage prod

# Verificar
serverless info --stage prod
```

#### 5.2 Estrategia Blue-Green

1. **Mantener PERN corriendo** en paralelo
2. **Apuntar frontend a AWS** progresivamente:
   - 10% tráfico → Lambda
   - 50% tráfico → Lambda
   - 100% tráfico → Lambda
3. **Monitorear métricas** (CloudWatch)
4. **Rollback si es necesario**

#### 5.3 Configurar DNS

```
# Route 53 o Cloudflare
api.catfecito.com → API Gateway endpoint
```

---

## 📊 Comparación de Rendimiento

### Latencia

| Operación    | PERN (Express) | AWS Serverless             |
| ------------ | -------------- | -------------------------- |
| Login        | ~150ms         | ~120ms (cold start ~800ms) |
| Get Products | ~80ms          | ~50ms                      |
| Create Order | ~200ms         | ~180ms                     |
| Webhook      | ~100ms         | ~70ms                      |

**Nota**: Cold starts solo ocurren tras 5-15 min de inactividad.

### Costos mensuales (1000 usuarios activos)

| Recurso       | PERN             | AWS Serverless        |
| ------------- | ---------------- | --------------------- |
| Servidor      | $25 (VPS)        | $0 (Lambda free tier) |
| Base de datos | $15 (PostgreSQL) | $5 (DynamoDB)         |
| Storage       | Incluido         | $1 (S3)               |
| Backup        | Manual           | Incluido              |
| **Total**     | **$40/mes**      | **$6/mes**            |

---

## 🚨 Desafíos y Soluciones

### Desafío 1: JOINs complejos

**Problema**: DynamoDB no soporta JOINs nativos.

**Solución**: Single Table Design + denormalización estratégica.

```javascript
// Guardar datos duplicados donde sea necesario
const orderItem = {
  PK: `ORDER#${orderId}`,
  SK: `ITEM#${productId}`,
  product_name: product.name, // ✅ Denormalizado
  product_price: product.price, // ✅ Denormalizado
  quantity: 2,
};
```

### Desafío 2: Transacciones atómicas

**Problema**: Garantizar consistencia en operaciones múltiples.

**Solución**: `TransactWriteCommand` de DynamoDB.

```javascript
await docClient.send(
  new TransactWriteCommand({
    TransactItems: [
      { Put: { TableName, Item: orderMetadata } },
      { Put: { TableName, Item: orderItem1 } },
      { Update: { TableName, Key: product1Key, ... } }, // Decrementar stock
      { Delete: { TableName, Key: cartItemKey } }
    ]
  })
);
// Todo o nada (atomicidad garantizada)
```

### Desafío 3: Cold starts de Lambda

**Problema**: Primera invocación tarda ~800ms.

**Solución**:

- Provisioned Concurrency (para endpoints críticos)
- Mantener funciones "calientes" con pings programados
- Optimizar tamaño de funciones

```yaml
functions:
  login:
    handler: functions/auth/login.handler
    provisionedConcurrency: 1 # Siempre 1 instancia lista
```

---

## ✅ Lista de Verificación Post-Migración

- [ ] Todos los endpoints responden correctamente
- [ ] Tests E2E pasando
- [ ] Logs configurados en CloudWatch
- [ ] Alertas de errores en SNS/Email
- [ ] Backup automático activado (DynamoDB PITR)
- [ ] CORS configurado correctamente
- [ ] Rate limiting en API Gateway
- [ ] Dominio personalizado configurado
- [ ] SSL/TLS activo
- [ ] Monitoreo con AWS X-Ray (opcional)
- [ ] Documentación actualizada
- [ ] Servidor PERN deprecado/apagado

---

## 📚 Recursos Adicionales

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 🎓 Lecciones Aprendidas

1. **Planificar el modelo de datos primero**: DynamoDB requiere pensar en access patterns desde el inicio
2. **Migrar por módulos**: No intentar todo a la vez
3. **Mantener compatibilidad en APIs**: El frontend no debería cambiar (misma estructura de responses)
4. **Monitoreo desde día 1**: CloudWatch + alarmas son críticos
5. **Automatizar todo**: Deploy, tests, rollbacks

---

**Tiempo total de migración**: ~6-8 semanas  
**ROI**: Reducción de costos del 85% + escalabilidad infinita
