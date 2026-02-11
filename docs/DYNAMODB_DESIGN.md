# Diseño de Base de Datos DynamoDB

Documentación técnica del diseño **Single Table** para CatFecito en AWS DynamoDB.

## 🎯 Filosofía de Diseño

DynamoDB es una base de datos **NoSQL** optimizada para:

- ✅ Lecturas/escrituras ultra rápidas (< 10ms)
- ✅ Escalado horizontal ilimitado
- ✅ Alta disponibilidad (99.99% SLA)

**Key Concept**: **Diseñar en base a patrones de acceso** (no en entidades como SQL).

---

## 📊 Modelo de Datos: Single Table Design

### ¿Por qué Single Table?

En lugar de múltiples tablas (como SQL), usamos **1 tabla con particiones lógicas**:

**Ventajas**:

- ✅ Reduce consumo de RCU/WCU (lecturas/escrituras)
- ✅ Permite queries relacionados en 1 sola operación
- ✅ Simplifica backups y gestión
- ✅ Optimiza costos

**Tabla**: `catfecito-serverless-{stage}`

**Partition Key (PK)**: Identifica la entidad  
**Sort Key (SK)**: Identifica el tipo de dato o relación

---

## 🗂️ Esquema Completo

### Tabla Principal

| PK (String)       | SK (String)        | GSI1PK              | GSI1SK           | GSI2PK           | GSI2SK           | Atributos                     |
| ----------------- | ------------------ | ------------------- | ---------------- | ---------------- | ---------------- | ----------------------------- |
| `USER#<uuid>`     | `METADATA`         | -                   | -                | -                | -                | name, email, password, role   |
| `PRODUCT#<uuid>`  | `METADATA`         | `CATEGORY#<cat>`    | `PRODUCT#<uuid>` | `PRODUCT#<name>` | `PRODUCT#<uuid>` | name, price, stock            |
| `CATEGORY#<slug>` | `METADATA`         | -                   | -                | -                | -                | name, description             |
| `ORDER#<uuid>`    | `METADATA`         | -                   | -                | -                | -                | user_id, total, status        |
| `ORDER#<uuid>`    | `ITEM#<prod_id>`   | -                   | -                | -                | -                | product_name, quantity, price |
| `USER#<uuid>`     | `CART#<prod_id>`   | `PRODUCT#<prod_id>` | `USER#<uuid>`    | -                | -                | quantity                      |
| `USER#<uuid>`     | `ORDER#<order_id>` | `ORDER#<order_id>`  | `METADATA`       | -                | -                | total, status                 |

---

## 🔍 Patrones de Acceso

### 1. Usuarios

#### 1.1 Obtener usuario por ID

```javascript
const result = await docClient.send(
  new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: "METADATA",
    },
  }),
);
```

**Complejidad**: O(1) - Lectura directa por clave primaria

#### 1.2 Buscar usuario por email (GSI2)

```javascript
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI2",
    KeyConditionExpression: "GSI2PK = :email",
    ExpressionAttributeValues: {
      ":email": `EMAIL#${email}`,
    },
  }),
);
```

**Estructura en GSI2**:

```
PK              | SK         | GSI2PK              | GSI2SK
USER#uuid       | METADATA   | EMAIL#juan@mail.com | USER#uuid
```

---

### 2. Productos

#### 2.1 Obtener todos los productos activos

```javascript
const result = await docClient.send(
  new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression:
      "begins_with(PK, :pk) AND SK = :sk AND is_active = :active",
    ExpressionAttributeValues: {
      ":pk": "PRODUCT#",
      ":sk": "METADATA",
      ":active": true,
    },
  }),
);
```

**Nota**: Scan es costoso, ideal para admin. Para usuarios usar cache o paginación.

#### 2.2 Obtener productos por categoría (GSI1)

```javascript
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :category",
    FilterExpression: "is_active = :active",
    ExpressionAttributeValues: {
      ":category": `CATEGORY#${categoryId}`,
      ":active": true,
    },
  }),
);
```

**Estructura en GSI1**:

```
PK              | SK         | GSI1PK          | GSI1SK
PRODUCT#uuid1   | METADATA   | CATEGORY#cafes  | PRODUCT#uuid1
PRODUCT#uuid2   | METADATA   | CATEGORY#cafes  | PRODUCT#uuid2
```

#### 2.3 Buscar producto por nombre (GSI2)

```javascript
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI2",
    KeyConditionExpression: "begins_with(GSI2PK, :prefix)",
    ExpressionAttributeValues: {
      ":prefix": `PRODUCT#${searchTerm.toLowerCase()}`,
    },
  }),
);
```

---

### 3. Categorías

#### 3.1 Obtener todas las categorías

```javascript
const result = await docClient.send(
  new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "begins_with(PK, :pk) AND SK = :sk",
    ExpressionAttributeValues: {
      ":pk": "CATEGORY#",
      ":sk": "METADATA",
    },
  }),
);
```

#### 3.2 Obtener categoría por ID (slug)

```javascript
const result = await docClient.send(
  new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CATEGORY#${categoryId}`,
      SK: "METADATA",
    },
  }),
);
```

---

### 4. Carrito de Compras

#### 4.1 Obtener carrito del usuario

```javascript
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "CART#",
    },
  }),
);
```

**Retorna**:

```
PK              | SK                | quantity
USER#uuid       | CART#product1     | 2
USER#uuid       | CART#product2     | 1
```

#### 4.2 Agregar producto al carrito

```javascript
await docClient.send(
  new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${userId}`,
      SK: `CART#${productId}`,
      GSI1PK: `PRODUCT#${productId}`, // Para queries inversas
      GSI1SK: `USER#${userId}`,
      quantity: 2,
      created_at: new Date().toISOString(),
    },
  }),
);
```

#### 4.3 Eliminar item del carrito

```javascript
await docClient.send(
  new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `CART#${productId}`,
    },
  }),
);
```

**Complejidad**: O(1) - Eliminación directa

---

### 5. Órdenes

#### 5.1 Crear orden (con items)

**Patrón**: Transacción atómica para consistencia.

```javascript
await docClient.send(
  new TransactWriteCommand({
    TransactItems: [
      // 1. Metadata de la orden
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
            user_id: userId,
            total: 3500.0,
            status: "pending",
            created_at: timestamp,
          },
        },
      },
      // 2. Índice usuario → orden
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `ORDER#${orderId}`,
            GSI1PK: `ORDER#${orderId}`,
            GSI1SK: "METADATA",
            total: 3500.0,
            status: "pending",
          },
        },
      },
      // 3. Items de la orden
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `ORDER#${orderId}`,
            SK: `ITEM#${productId}`,
            product_name: "Café Premium",
            quantity: 2,
            price: 1500,
            subtotal: 3000,
          },
        },
      },
      // 4. Eliminar del carrito
      {
        Delete: {
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `CART#${productId}`,
          },
        },
      },
      // 5. Decrementar stock
      {
        Update: {
          TableName: TABLE_NAME,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA",
          },
          UpdateExpression: "SET stock = stock - :qty",
          ConditionExpression: "stock >= :qty", // Falla si no hay stock
          ExpressionAttributeValues: {
            ":qty": 2,
          },
        },
      },
    ],
  }),
);
```

**Ventajas**:

- ✅ Todo o nada (atomicidad)
- ✅ Máximo 100 operaciones por transacción
- ✅ Consistencia garantizada

#### 5.2 Obtener órdenes del usuario

```javascript
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "ORDER#",
    },
  }),
);
```

**Retorna índice**:

```
PK          | SK              | total   | status
USER#uuid   | ORDER#order1    | 3500.00 | paid
USER#uuid   | ORDER#order2    | 1200.00 | pending
```

#### 5.3 Obtener orden completa (metadata + items)

```javascript
// 1 sola query
const result = await docClient.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `ORDER#${orderId}`,
    },
  }),
);
```

**Retorna**:

```
PK              | SK              | Atributos
ORDER#uuid      | METADATA        | total, status, user_id
ORDER#uuid      | ITEM#product1   | quantity, price
ORDER#uuid      | ITEM#product2   | quantity, price
```

**Sin JOINs**: Todo en 1 query (vs 3 queries en SQL).

---

## 🔐 Índices Secundarios Globales (GSI)

### GSI1: Relaciones inversas

**Uso**: Buscar productos por categoría, órdenes por usuario, etc.

```yaml
GSI1:
  PK: GSI1PK
  SK: GSI1SK
  Projection: ALL
```

**Ejemplos**:

| Entidad     | GSI1PK           | GSI1SK         | Uso                                |
| ----------- | ---------------- | -------------- | ---------------------------------- |
| Producto    | `CATEGORY#cafes` | `PRODUCT#uuid` | Productos de categoría             |
| Cart Item   | `PRODUCT#uuid`   | `USER#user_id` | Usuarios con producto X en carrito |
| Order Index | `ORDER#order_id` | `METADATA`     | Metadata de orden desde GSI        |

### GSI2: Búsquedas por atributos únicos

**Uso**: Buscar usuario por email, producto por nombre.

```yaml
GSI2:
  PK: GSI2PK
  SK: GSI2SK
  Projection: ALL
```

**Ejemplos**:

| Entidad  | GSI2PK                 | GSI2SK         | Uso                 |
| -------- | ---------------------- | -------------- | ------------------- |
| Usuario  | `EMAIL#juan@mail.com`  | `USER#uuid`    | Login por email     |
| Producto | `PRODUCT#cafe-premium` | `PRODUCT#uuid` | Búsqueda por nombre |

---

## 💰 Optimización de Costos

### Capacidad de lectura/escritura

```yaml
# serverless.yml
ProvisionedThroughput:
  ReadCapacityUnits: 5 # 5 RCU = 20 lecturas/seg
  WriteCapacityUnits: 5 # 5 WCU = 5 escrituras/seg
```

**Costo estimado (On-Demand)**:

- Lectura: $0.25 por millón de requests
- Escritura: $1.25 por millón de requests
- Storage: $0.25 por GB/mes

**Para 100k requests/mes**:

- Lecturas (80%): $0.02
- Escrituras (20%): $0.025
- Storage (1 GB): $0.25
- **Total**: ~$0.30/mes

### Estrategias de ahorro

1. **Usar On-Demand** para cargas variables
2. **Provisioned** para cargas predecibles (más barato)
3. **Cachear en Lambda** (variables globales)
4. **Batch operations** (BatchGet, BatchWrite)
5. **Proyecciones** (solo atributos necesarios)

```javascript
// ❌ Mal: Obtener todos los atributos
const result = await docClient.send(new GetCommand({ TableName, Key }));

// ✅ Bien: Proyección selectiva
const result = await docClient.send(
  new GetCommand({
    TableName,
    Key,
    ProjectionExpression: "id, #name, price",
    ExpressionAttributeNames: { "#name": "name" },
  }),
);
```

---

## 🚀 Buenas Prácticas

### 1. Denormalización estratégica

**Duplicar datos** que se consultan juntos:

```javascript
// ❌ Mal: Guardar solo ID
{
  PK: "ORDER#uuid",
  SK: "ITEM#product1",
  product_id: "product1", // Solo ID
  quantity: 2
}

// ✅ Bien: Denormalizar datos frecuentes
{
  PK: "ORDER#uuid",
  SK: "ITEM#product1",
  product_id: "product1",
  product_name: "Café Premium",    // ✅ Denormalizado
  product_price: 1500,              // ✅ Denormalizado
  quantity: 2,
  subtotal: 3000
}
```

**Ventaja**: No necesitas consultar la tabla de productos.

### 2. Timestamps consistentes

```javascript
const getTimestamp = () => new Date().toISOString();

// Todos los registros usan el mismo formato
created_at: "2026-02-11T10:30:00.000Z";
```

### 3. Prefijos consistentes

```javascript
// ✅ Nomenclatura clara
PK: "USER#uuid";
PK: "PRODUCT#uuid";
PK: "ORDER#uuid";
PK: "CATEGORY#slug";

// ❌ Evitar
PK: "user-uuid";
PK: "prod_uuid";
```

### 4. Validar before write

```javascript
// Condiciones para evitar sobrescribir
await docClient.send(
  new PutCommand({
    TableName: TABLE_NAME,
    Item: newItem,
    ConditionExpression: "attribute_not_exists(PK)", // Solo si no existe
  }),
);
```

### 5. Usar transacciones para operaciones críticas

```javascript
// ✅ Orden + decrementar stock = transacción atómica
await docClient.send(new TransactWriteCommand({...}));

// ❌ Evitar operaciones separadas que puedan fallar a medias
```

---

## 🔍 Debugging y Monitoreo

### CloudWatch Metrics

```bash
# Ver métricas de la tabla
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=catfecito-serverless-dev \
  --start-time 2026-02-11T00:00:00Z \
  --end-time 2026-02-11T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### DynamoDB Streams (opcional)

Activar para:

- Auditoría de cambios
- Triggers automáticos
- Replicación cross-region

```yaml
# serverless.yml
StreamSpecification:
  StreamViewType: NEW_AND_OLD_IMAGES
```

---

## 📊 Comparación SQL vs DynamoDB

| Operación                           | PostgreSQL                                                            | DynamoDB                                      |
| ----------------------------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| **Obtener usuario por ID**          | `SELECT * FROM users WHERE id = ?`                                    | `GetItem(PK=USER#id, SK=METADATA)`            |
| **Login (por email)**               | `SELECT * FROM users WHERE email = ?`                                 | `Query(GSI2PK=EMAIL#email)`                   |
| **Productos de categoría**          | `SELECT * FROM products WHERE category_id = ? AND is_active = true`   | `Query(GSI1PK=CATEGORY#id, FilterExpression)` |
| **Orden con items**                 | `SELECT ... FROM orders JOIN order_items ON ... JOIN products ON ...` | `Query(PK=ORDER#id)` (1 query, sin JOINs)     |
| **Crear orden + decrementar stock** | `BEGIN; INSERT...; UPDATE...; COMMIT;`                                | `TransactWriteCommand([Put, Update])`         |

---

## 🎓 Recursos Recomendados

- [The DynamoDB Book - Alex DeBrie](https://www.dynamodbbook.com/)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single Table Design Masterclass](https://www.youtube.com/watch?v=HaEPXoXVf2k)
- [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html) - Tool de diseño

---

**Conclusión**: DynamoDB requiere un cambio de mentalidad, pero ofrece **escalabilidad, velocidad y costos optimizados** que son difíciles de igualar con bases relacionales tradicionales.
