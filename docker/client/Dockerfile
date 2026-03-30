# Dockerfile base para frontend (Vite + React)
# Estado: scaffolding desactivado por defecto.
# Se activara cuando el equipo tenga Docker instalado y validado.

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

FROM nginx:1.27-alpine AS runtime

COPY docker/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# MODO DESACTIVADO (intencional)
# Cuando quieras activarlo, reemplaza el CMD por el de nginx real.
# CMD ["nginx", "-g", "daemon off;"]
CMD ["sh", "-c", "echo 'Frontend Docker scaffold creado pero desactivado. Activalo cuando tengas Docker listo.' && sleep infinity"]
