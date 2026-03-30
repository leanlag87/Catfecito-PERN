# Workflows CI/CD (modo desactivado)

Estos workflows fueron creados como base, pero estan desactivados por defecto.

Archivos:

- ci.yml
- cd-dev.yml
- cd-staging.yml
- cd-prod.yml

## Estado actual

- Trigger solo manual: workflow_dispatch
- Jobs principales desactivados con:
  - if: false

## Como activarlos

1. Editar cada workflow y cambiar if: false por la condicion de activacion deseada.
2. Ajustar triggers en cada workflow segun estrategia:
   - CI: push/pull_request en develop/main
   - CD Dev: push a develop
   - CD Staging: push a release/\* o manual
   - CD Prod: push a main
3. Reemplazar pasos placeholder (echo) por deploy real.
4. (Opcional) Agregar variables/secrets por entorno.

## Recomendacion para Production

- Configurar environment protection rules:
  - Required reviewers
  - Restriccion de rama a main
  - Secrets separados por entorno
