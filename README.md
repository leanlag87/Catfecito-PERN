# CatFecito - Ecommerce Serverless

Un ecommerce moderno que **evolucionó** de una arquitectura tradicional **PERN** (PostgreSQL, Express.js, React, Node.js) a una **arquitectura serverless completamente escalable** con servicios de AWS.

## 🚀 Historia del Proyecto

### Versión 1.0 - Stack PERN (Tradicional)

- **Frontend**: React + Vite
- **Backend**: Node.js + Express.js (servidor monolítico)
- **Base de datos**: PostgreSQL (relacional)
- **Hosting**: Servidor tradicional
- **Estado**: ✅ Completado y funcional

### Versión 2.0 - Arquitectura Serverless AWS (Actual)

- **Frontend**: React + Vite
- **Backend**: AWS Lambda + API Gateway (funciones serverless)
- **Base de datos**: AWS DynamoDB (NoSQL)
- **Framework**: Serverless Framework
- **Autenticación**: JWT con AWS Cognito
- **Pagos**: MercadoPago + Webhooks
- **Almacenamiento**: AWS S3 (imágenes de productos)
- **Estado**: 🚀 **Producción actual**

## 🎯 ¿Por qué la migración?

La migración a AWS permitió:

✅ **Escalabilidad automática** - Las funciones Lambda escalan según demanda  
✅ **Costo optimizado** - Pago solo por uso real (sin servidores idle)  
✅ **Alta disponibilidad** - Infraestructura distribuida globalmente  
✅ **Mantenimiento reducido** - Sin gestión de servidores  
✅ **Arquitectura en capas** - Repositories, Services y Handlers separados

## 📁 Estructura del Proyecto Actual

```
├── client/                 # Aplicación React (Frontend)
├── server/                 # Backend Serverless (AWS Lambda)
│   ├── functions/          # Handlers de Lambda (controllers)
│   ├── services/           # Lógica de negocio
│   ├── repositories/       # Acceso a datos (DynamoDB)
│   ├── utils/              # Utilidades y helpers
│   ├── libs/               # Integraciones (MercadoPago, S3)
│   └── serverless.yml      # Configuración de infraestructura
├── database/               # Scripts SQL (versión PERN - legacy)
└── uploads/                # Archivos locales (versión PERN - legacy)
```

## 🛠️ Configuración e Instalación

### 📋 Backend Serverless (AWS)

👉 **[BACKEND_INSTRUCTIONS.md](BACKEND_INSTRUCTIONS.md)**

- Configuración de AWS credentials
- Despliegue con Serverless Framework
- Variables de entorno
- Configuración de DynamoDB
- Integración con MercadoPago

### 🎨 Frontend

👉 **[FRONTEND_INSTRUCTIONS.md](FRONTEND_INSTRUCTIONS.md)**

- Instalación y configuración del cliente React
- Variables de desarrollo/producción
- Conexión con API Gateway

### 📦 Versión Legacy (PERN)

Si deseas ejecutar la **versión original PERN**:

- Revisa el branch `legacy/pern-stack`
- Instrucciones en `LEGACY_BACKEND_INSTRUCTIONS.md`
- Frontend en `LEGACY_FRONTEND_INSTRUCTIONS.md`

## ⚡ Inicio Rápido (Versión Serverless)

1. **Clona el repositorio**

   ```bash
   git clone <repo-url>
   cd catfecito
   ```

2. **Configura AWS credentials**

   ```bash
   aws configure
   ```

3. **Despliega el backend**

   ```bash
   cd server
   npm install
   serverless deploy
   ```

4. **Configura el frontend**

   ```bash
   cd client
   npm install
   npm run dev
   ```

5. **¡Listo!** Tu ecommerce serverless estará corriendo

## 🎯 Características

### Funcionalidades Core

- ✅ Gestión de productos y categorías
- ✅ Sistema de usuarios y autenticación (JWT)
- ✅ Carrito de compras en tiempo real
- ✅ Procesamiento de órdenes
- ✅ Panel de administración completo
- ✅ Integración de pagos con MercadoPago
- ✅ Subida de imágenes a S3
- ✅ Webhooks para notificaciones de pago
- ✅ Responsive design

### Arquitectura Técnica

- ✅ **Arquitectura en capas** (Repository → Service → Handler)
- ✅ **Transacciones atómicas** en DynamoDB
- ✅ **Manejo centralizado de errores**
- ✅ **Validaciones robustas**
- ✅ **Código 100% reutilizable**
- ✅ **Preparado para tests**

## 📊 Comparación de Arquitecturas

| Característica     | PERN (v1.0)          | Serverless AWS (v2.0) |
| ------------------ | -------------------- | --------------------- |
| **Escalabilidad**  | Manual               | Automática            |
| **Costo base**     | Servidor 24/7        | Pay-per-use           |
| **Base de datos**  | PostgreSQL           | DynamoDB              |
| **Backend**        | Express monolítico   | Funciones Lambda      |
| **Mantenimiento**  | Alto                 | Bajo                  |
| **Deploy**         | Manual               | CI/CD automatizado    |
| **Disponibilidad** | Depende del servidor | 99.99% SLA            |

## 📝 Endpoints Principales

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/verify

Products:
  GET    /api/products
  GET    /api/products/{id}
  GET    /api/products/category/{category_id}

Cart:
  GET    /api/users/cart
  POST   /api/users/cart
  PUT    /api/users/cart/{product_id}
  DELETE /api/users/cart/{product_id}

Orders:
  POST   /api/users/orders
  GET    /api/users/orders
  GET    /api/users/orders/{id}

Payments:
  POST   /api/payments/create-preference
  GET    /api/payments/status/{order_id}
  POST   /api/payments/webhook

Admin:
  GET    /api/admin/products
  POST   /api/admin/products
  PUT    /api/admin/products/{id}
  DELETE /api/admin/products/{id}
  ...
```

## 🔐 Seguridad

- JWT para autenticación
- Validación de roles (admin/user)
- Variables de entorno para secretos
- CORS configurado
- Validaciones en todos los endpoints
- Rate limiting en API Gateway

## 🚀 Stack Tecnológico Completo

**Frontend:**

- React 18
- Vite
- React Router
- Context API
- Axios

**Backend:**

- AWS Lambda (Node.js 20.x)
- API Gateway
- DynamoDB
- S3
- Serverless Framework

**Servicios Externos:**

- MercadoPago (pagos)
- AWS CloudWatch (logs)

## 📚 Documentación Adicional

- [Guía de migración PERN → AWS](docs/MIGRATION_GUIDE.md)
- [Arquitectura DynamoDB](docs/DYNAMODB_DESIGN.md)
- [Manual de deployment](BACKEND_INSTRUCTIONS.md)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Añade nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT.

---

**Nota**: La versión PERN original se mantiene disponible en el branch `legacy/pern-stack` como referencia histórica.
