# Docker scaffold (desactivado)

Este directorio contiene la base de dockerizacion de Catfecito.

Estado actual:

- Estructura creada
- Dockerfiles creados
- docker-compose creado
- Modo desactivado intencionalmente
- `.dockerignore` temporal en modo placeholder para evitar errores del parser local
- Reglas reales guardadas en `docker/.dockerignore.template`

Por que esta desactivado:

- Aun no tienes Docker instalado
- Falta confirmar el entrypoint backend local definitivo

Cuando quieras activarlo, cambia:

1. `docker/server/Dockerfile`

- Reemplazar CMD de mensaje por el comando real del backend.

2. `docker/client/Dockerfile`

- Reemplazar CMD de mensaje por `nginx`.

3. `docker-compose.dev.yml`

- Quitar `profiles: ["manual-enable"]` si quieres arranque por defecto.
- Reemplazar `command` de ambos servicios por su arranque real.

4. `.dockerignore`

- Reemplazar el contenido de `.dockerignore` con `docker/.dockerignore.template`.

Comando futuro de ejemplo cuando este activado:

```bash
docker compose -f docker-compose.dev.yml --profile manual-enable up --build
```
