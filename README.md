# CatFecito - Ecommerce PERN

Un ecommerce moderno desarrollado con el stack **PERN** (PostgreSQL, Express.js, React, Node.js) que permite la gestión completa de productos, usuarios, carritos de compra y órdenes con integración de pagos.

## 🚀 Tecnologías

- **Frontend**: React + Vite
- **Backend**: Node.js + Express.js
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Pagos**: Integración con MercadoPago
- **Subida de archivos**: Multer

## 📁 Estructura del Proyecto

```
├── client/          # Aplicación React (Frontend)
├── server/          # API REST con Express (Backend)
├── database/        # Scripts SQL de inicialización
└── uploads/         # Archivos subidos (imágenes de productos)
```

## 🛠️ Configuración e Instalación

Para configurar y ejecutar el proyecto, consulta las instrucciones específicas:

### 📋 Instrucciones del Backend
👉 **[BACKEND_INSTRUCTIONS.md](BACKEND_INSTRUCTIONS.md)**

- Configuración de variables de entorno
- Instalación de dependencias
- Configuración de PostgreSQL
- Creación del primer usuario administrador
- Exposición con ngrok para webhooks

### 🎨 Instrucciones del Frontend
👉 **[FRONTEND_INSTRUCTIONS.md](FRONTEND_INSTRUCTIONS.md)**

- Instalación y configuración del cliente React
- Configuración de variables de desarrollo
- Construcción para producción
- Registro de usuarios y administradores

## ⚡ Inicio Rápido

1. **Clona el repositorio**
2. **Configura el backend**: Sigue las instrucciones en [BACKEND_INSTRUCTIONS.md](BACKEND_INSTRUCTIONS.md)
3. **Configura el frontend**: Sigue las instrucciones en [FRONTEND_INSTRUCTIONS.md](FRONTEND_INSTRUCTIONS.md)
4. **¡Listo!** Tu ecommerce estará corriendo

## 🎯 Características

- ✅ Gestión de productos y categorías
- ✅ Sistema de usuarios y autenticación
- ✅ Carrito de compras
- ✅ Procesamiento de órdenes
- ✅ Panel de administración
- ✅ Integración de pagos con MercadoPago
- ✅ Subida de imágenes de productos
- ✅ Responsive design

## 📝 Notas

Este proyecto utiliza una arquitectura separada donde el frontend y backend son aplicaciones independientes que se comunican a través de una API REST.