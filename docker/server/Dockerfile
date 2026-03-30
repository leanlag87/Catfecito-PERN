# Dockerfile base para backend de Catfecito
# Estado: scaffolding desactivado por defecto.
# Nota: el entrypoint local del backend debe confirmarse antes de activar.

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY serverless.yml ./serverless.yml

EXPOSE 5000

# MODO DESACTIVADO (intencional)
# Pendiente definir el comando real del backend local.
# Ejemplo posible cuando se active:
# CMD ["node", "server/index.js"]
CMD ["sh", "-c", "echo 'Backend Docker scaffold creado pero desactivado. Definir entrypoint real antes de activarlo.' && sleep infinity"]
