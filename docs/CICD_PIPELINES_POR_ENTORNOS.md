# CI/CD de Catfecito con pipelines por entornos

Esta guia define una estrategia de CI/CD empresarial para Catfecito con tres entornos: Development, Staging y Production.

## 1. Objetivo

Automatizar calidad, seguridad y despliegue con gates por entorno para reducir riesgo en produccion.

## 2. Modelo de entornos

1. Development

- Integracion rapida de cambios
- Validaciones de build, lint y pruebas base
- Deploy automatico a entorno dev

2. Staging

- Replica operativa de produccion
- Validaciones ampliadas (integracion, e2e, smoke)
- Aprobacion manual recomendada antes de deploy

3. Production

- Entorno real de negocio
- Requiere protecciones estrictas
- Deploy controlado con aprobacion y rollback definido

## 3. Flujo recomendado de ramas

- feature/\* -> Pull Request hacia develop
- develop -> deploy automatico a Development
- release/\* o merge de develop a main -> Staging
- main -> Production (manual approval + checks)

## 4. Pipeline empresarial (alto nivel)

Etapas sugeridas:

1. Validate

- Instalacion de dependencias
- Lint
- Build frontend y backend

2. Test

- Unit tests frontend
- Tests de backend
- Pruebas de contrato API (si aplica)

3. Security

- npm audit
- Escaneo de dependencias (SCA)
- Escaneo de secretos

4. Package

- Build de artefactos
- Build de imagen Docker (si aplica)
- Firma y versionado

5. Deploy por entorno

- Deploy Dev automatico
- Deploy Staging con aprobacion opcional
- Deploy Prod con aprobacion obligatoria

6. Post-Deploy

- Smoke tests
- Health checks
- Notificaciones

## 5. Estructura sugerida de workflows

```text
.github/
  workflows/
    ci.yml
    cd-dev.yml
    cd-staging.yml
    cd-prod.yml
    dependabot-auto-merge.yml
```

Puedes conservar tu pipeline actual y evolucionarlo en estos workflows separados para mayor gobernanza.

## 6. GitHub Environments (recomendado)

Crear entornos en GitHub:

- development
- staging
- production

Configurar por entorno:

- Secrets propios (URLs, tokens, claves)
- Reglas de aprobacion para staging/prod
- Branch restrictions
- Protection rules

## 7. Ejemplo de logica por entorno

### Development

Trigger:

- push a develop

Acciones:

- correr CI
- desplegar automaticamente
- ejecutar smoke test basico

### Staging

Trigger:

- push a release/\* o workflow dispatch manual

Acciones:

- correr CI completo
- desplegar a staging
- correr pruebas de integracion/e2e
- requerir aprobacion para promover a prod

### Production

Trigger:

- push a main o promote desde staging

Acciones:

- validar checks requeridos
- aprobacion manual obligatoria
- deploy gradual (blue/green o canary)
- monitoreo post deploy y rollback si falla

## 8. Ejemplo de workflow unico con ambientes

```yaml
name: Catfecito CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]
  workflow_dispatch:
    inputs:
      target_env:
        description: Entorno objetivo
        required: true
        default: development
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install root deps
        run: npm ci
      - name: Build client
        run: npm --prefix client ci && npm --prefix client run build
      - name: Validate backend
        run: node -c server/index.js

  deploy-development:
    if: github.ref == 'refs/heads/develop'
    needs: ci
    runs-on: ubuntu-latest
    environment: development
    steps:
      - run: echo Deploying to development

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: ci
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo Deploying to production
```

Nota: para version empresarial se recomienda separar CI y CD en workflows distintos y reutilizables.

## 9. Integracion con el pipeline que ya tienes

Tu base actual ya cubre:

- Tests cliente y servidor
- Security audit
- Resumen final
- Dependabot auto-merge para minor/patch

Siguiente evolucion recomendada:

1. Separar CI de CD.
2. Introducir entornos de GitHub con reglas.
3. Desplegar automatico en development.
4. Agregar aprobaciones para staging y production.
5. Añadir smoke tests post-deploy.

## 10. Ventajas de CI/CD en esta app

- Menos errores manuales en release.
- Tiempo de entrega mas rapido.
- Calidad consistente por checks automáticos.
- Seguridad integrada desde pipeline.
- Mejor trazabilidad de cambios.
- Facilita rollback y respuesta a incidentes.

## 11. Desventajas y trade-offs

- Coste inicial de configuracion y mantenimiento.
- Puede aumentar el tiempo de feedback si hay demasiados checks.
- Requiere disciplina en ramas, secretos y versionado.
- Falsos positivos de seguridad pueden frenar despliegues.
- Dependencia de la plataforma CI/CD.

## 12. Checklist minimo para produccion

- Branch protection activa en main
- Required checks configurados
- Aprobacion obligatoria en production
- Secrets segregados por entorno
- Smoke tests post deploy
- Plan de rollback documentado
- Alertas y monitoreo operativos

## 13. Roadmap de implementacion sugerido

Semana 1:

- Consolidar CI actual (lint, build, test, security)
- Definir environments en GitHub

Semana 2:

- Automatizar deploy development
- Activar smoke tests

Semana 3:

- Implementar deploy staging con aprobacion
- Añadir pruebas de integracion

Semana 4:

- Implementar production con approvals y rollback
- Medir KPIs de pipeline (duracion, tasa de fallos, lead time)
