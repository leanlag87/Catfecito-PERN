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
