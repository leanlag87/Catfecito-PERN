# Dockerizacion de Catfecito desde cero

Esta guia explica como dockerizar Catfecito paso a paso, con foco en un flujo profesional y mantenible.

## 1. Objetivo

Llevar la app a ejecucion por contenedores para estandarizar entornos, simplificar onboarding y preparar despliegues repetibles.

## 2. Estado actual de Catfecito

- Frontend: React + Vite en client
- Backend: Node.js con codigo en server y configuracion serverless en serverless.yml
- Persistencia principal actual: servicios AWS (DynamoDB, S3, etc.)

Conclusión: la dockerizacion debe ser hibrida.

- Docker para frontend y backend de app.
- Servicios cloud se mantienen gestionados por AWS (en staging y prod).

## 3. Estrategia recomendada

Aplicar 2 modos de ejecucion.

1. Modo Desarrollo Local

- Frontend en contenedor
- Backend en contenedor
- Servicios externos apuntando a AWS dev o mocks locales

2. Modo Produccion

- Imagen frontend optimizada (Nginx o runtime estatico)
- Imagen backend solo si se despliega en contenedores
- Si se mantiene Serverless en AWS Lambda, Docker queda para desarrollo, test y parity de entorno

## 4. Estructura sugerida

```text
Catfecito-PERN/
  docker/
    client/
      Dockerfile
      nginx.conf
    server/
      Dockerfile
  docker-compose.dev.yml
  docker-compose.staging.yml
  docker-compose.prod.yml
  .dockerignore
```

## 5. Dockerfile para frontend (Vite)

Dockerfile multi-stage recomendado:

```dockerfile
# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Runtime
FROM nginx:1.27-alpine
COPY docker/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Notas:

- Vite genera salida en dist.
- Configura variables VITE\_ en build args o en pipeline antes del build.

## 6. Dockerfile para backend (Node)

Si ejecutas API Node en contenedor:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY .env ./.env
EXPOSE 5000
CMD ["node", "server/index.js"]
```

Si el backend productivo continua en Lambda:

- Usa este contenedor solo para pruebas locales, smoke tests y desarrollo.

## 7. Compose para desarrollo

Ejemplo base:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: docker/client/Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: docker/server/Dockerfile
    env_file:
      - .env
    ports:
      - "5000:5000"
```

Comandos utiles:

```bash
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml down
```

## 8. Variables de entorno y secretos

Recomendaciones:

- Nunca hornear secretos en imagen.
- Usar env por entorno:
  - .env.dev
  - .env.staging
  - .env.prod
- En CI/CD usar secretos del proveedor (GitHub Environments, AWS Secrets Manager, Parameter Store).

## 9. Networking y CORS

Checklist:

- Permitir origen del frontend containerizado en backend.
- Revisar allowedOrigins en serverless.yml para dev, staging y prod.
- Si frontend se sirve por Nginx con dominio propio, registrar ese origen en CORS.

## 10. Health checks y observabilidad

Agregar:

- Endpoint de salud en backend: /health
- Healthcheck en compose
- Logs estructurados JSON
- Integracion con CloudWatch o stack de observabilidad

## 11. Ventajas de dockerizar Catfecito

- Entorno consistente para todo el equipo.
- Onboarding mas rapido.
- Menos errores de "en mi maquina funciona".
- Base clara para CI/CD reproducible.
- Facilita pruebas de integracion y smoke tests.
- Escalable a orquestacion futura (ECS, Kubernetes).

## 12. Desventajas y costos

- Curva de aprendizaje inicial.
- Mayor complejidad de red y variables.
- Build de imagen puede ser lento sin cache.
- Si la app sigue serverless, no todo el runtime final usa contenedores.
- Requiere politica de seguridad de imagenes (escaneo y parches).

## 13. Recomendacion final para esta app

Para Catfecito conviene una adopcion progresiva:

1. Dockerizar frontend y backend local primero.
2. Integrar docker build en CI para validar reproducibilidad.
3. Mantener backend productivo en Serverless AWS mientras madura la operacion.
4. Reevaluar migracion a contenedores productivos solo si hay necesidad real de runtime persistente.

## 14. Checklist de adopcion

- Dockerfiles multi-stage listos
- Compose dev funcionando
- CORS por entorno validado
- Variables y secretos segregados
- Health checks implementados
- Imagenes escaneadas en CI
- Guia de uso para equipo publicada

## 15. Ejecutable inmediato para este repo

Si lo aplicas ya, crea estos archivos exactamente con este contenido inicial.

### 15.1 Archivos a crear

```text
docker/client/Dockerfile
docker/client/nginx.conf
docker/server/Dockerfile
docker-compose.dev.yml
.dockerignore
```

### 15.2 Contenido minimo inicial

Archivo: docker/client/Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_BACKEND_URL
ARG VITE_MP_PUBLIC_KEY
ARG VITE_APP_NAME
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Archivo: docker/client/nginx.conf

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

Archivo: docker/server/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
EXPOSE 5000
CMD ["node", "server/index.js"]
```

Archivo: docker-compose.dev.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: docker/server/Dockerfile
    env_file:
      - .env
    ports:
      - "5000:5000"

  frontend:
    build:
      context: .
      dockerfile: docker/client/Dockerfile
      args:
        VITE_BACKEND_URL: ${VITE_BACKEND_URL}
        VITE_MP_PUBLIC_KEY: ${VITE_MP_PUBLIC_KEY}
        VITE_APP_NAME: ${VITE_APP_NAME}
    depends_on:
      - backend
    ports:
      - "5173:80"
```

Archivo: .dockerignore

```text
node_modules
**/node_modules
dist
**/dist
.git
.github
.vscode
.idea
*.log
npm-debug.log*
```

### 15.3 Comandos para levantar

```bash
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml down
```

### 15.4 Verificacion rapida

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Confirmar que el frontend apunte a la URL correcta de API en VITE_BACKEND_URL.
