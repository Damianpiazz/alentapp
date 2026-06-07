# Análisis de Infraestructura Docker: Fase 1

**Archivos analizados:**

- `docker-compose.yml`
- `packages/api/Dockerfile`
- `packages/web/Dockerfile`

---

## 1.1. Problemas y Vulnerabilidades en la Configuración Docker

### Tabla de Problemas Identificados

| #   | Problema                                                                     | ¿Dónde ocurre?                                                                                    | Impacto | Solución propuesta                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Credenciales hardcodeadas en texto plano                                     | `docker-compose.yml:6-8` (POSTGRES_PASSWORD) y `:30` (DATABASE_URL)                               | Alto    | Usar archivo `.env` externo (no commiteado) con `${VAR}`. En producción, usar Docker Secrets.                                                                                                       |
| 2   | Contenedores ejecutándose como root                                          | `packages/api/Dockerfile` y `packages/web/Dockerfile` — sin `USER`                                | Alto    | Agregar `addgroup` + `adduser` + `USER appuser` antes del `CMD` en ambos Dockerfiles.                                                                                                               |
| 3   | Sin healthchecks en API ni Web                                               | `docker-compose.yml`, servicios `api` y `web` — solo `db` tiene healthcheck                       | Medio   | Agregar healthchecks con `wget --spider` (`node:20-alpine` incluye BusyBox wget). API: `http://localhost:3000/health`, Web: `http://localhost:5173`. Incluir `start_period`, `interval`, `retries`. |
| 4   | Volumen `.:/app` monta todo el código fuente host sobre la imagen construida | `docker-compose.yml:25` (api) y `:52` (web) — `volumes: - .:/app`                                 | Alto    | Separar dev/prod: bind mounts solo en `docker-compose.override.yml` (aplicado automático en dev). Producción usa solo el `docker-compose.yml` base.                                                 |
| 5   | `packages/web/Dockerfile` no copia `packages/shared/package.json`            | `packages/web/Dockerfile:7` — omite `packages/shared/` que la API sí incluye (`api/Dockerfile:8`) | Medio   | Agregar `COPY packages/shared/package.json ./packages/shared/` antes del `RUN npm install` en el web Dockerfile.                                                                                    |

---

### Detalle de cada problema

#### Problema 1: Credenciales hardcodeadas

```yaml
# docker-compose.yml (líneas 6–8)
environment:
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: password123 # ← expuesta en el repo + historial Git
    POSTGRES_DB: alentapp_db
```

**Solución:**

```bash
# .env — no se commitea (incluir en .gitignore)
POSTGRES_USER=admin
POSTGRES_PASSWORD=s3cur3P@ssw0rd
POSTGRES_DB=alentapp_db
DATABASE_URL=postgres://admin:s3cur3P@ssw0rd@db:5432/alentapp_db
```

```yaml
# docker-compose.yml
environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
```

---

#### Problema 2: Contenedores ejecutándose como root

Los procesos corren como `root` por defecto. Si un atacante compromete la app, tiene control total del contenedor.

**Solución (agregar antes del CMD en ambos Dockerfiles):**

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser
```

---

#### Problema 3: Sin healthchecks en API ni Web

`db` tiene healthcheck con `pg_isready`, pero `api` y `web` no. Si se traban post-arranque, Docker no lo detecta. `web` además depende de `api` sin `condition: service_healthy`.

**Solución:**

```yaml
api:
    healthcheck:
        test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3000/health']
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 40s

web:
    healthcheck:
        test:
            [
                'CMD',
                'wget',
                '--no-verbose',
                '--tries=1',
                '--spider',
                'http://localhost:5173',
            ]
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 30s
    depends_on:
        api:
            condition: service_started
```

`wget` es una herramienta CLI para descargar/verificar recursos HTTP/HTTPS. Está disponible en `node:20-alpine` (incluida en BusyBox). `--spider` solo verifica que la URL existe sin descargar contenido.

---

#### Problema 4: Volumen `.:/app` invalida la imagen construida

```yaml
volumes:
    - .:/app # sobrescribe el COPY . . de la imagen
```

El bind mount hace que el contenedor ejecute el código del host en vez del empaquetado en la imagen. Útil para desarrollo (hot-reload), desastroso para producción.

**Solución:**

```yaml
# docker-compose.yml — base, sin bind mounts (producción)
services:
    api:
        build: ...
    web:
        build: ...
```

```yaml
# docker-compose.override.yml — solo desarrollo (se aplica automáticamente)
services:
    api:
        volumes:
            - .:/app
            - /app/node_modules
            - /app/packages/api/node_modules
            - /app/packages/shared/node_modules
    web:
        volumes:
            - .:/app
            - /app/node_modules
            - /app/packages/shared/node_modules
            - /app/packages/web/node_modules
```

En producción se usa `docker compose up` sin el override (o con `-f docker-compose.yml` explícito).

---

#### Problema 5: `web/Dockerfile` omite `packages/shared/package.json`

```dockerfile
# packages/web/Dockerfile — actual
COPY package*.json ./
COPY packages/web/package*.json ./packages/web/
# falta: COPY packages/shared/package.json ./packages/shared/
RUN npm install
```

npm workspace no puede resolver `@alentapp/shared` → error en tiempo de instalación o runtime.

**Solución:**

```dockerfile
# packages/web/Dockerfile — corregido
COPY package*.json ./
COPY packages/web/package*.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/  # ← agregado
RUN npm install
COPY . .
```

---

## 1.2. Investigación: OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework de observabilidad open-source (CNCF) que proporciona APIs, SDKs y herramientas para instrumentar aplicaciones y recolectar datos de telemetría (trazas, métricas y logs). Es neutro respecto a proveedores y se ha convertido en el estándar de la industria.

**Prometheus** es un sistema de monitoreo especializado solo en métricas, con un modelo de recolección por scraping (pull).

| Aspecto        | OpenTelemetry                | Prometheus                |
| -------------- | ---------------------------- | ------------------------- |
| Alcance        | Trazas + Métricas + Logs     | Solo métricas             |
| Modelo         | Push (OTLP) y Pull           | Pull (scraping)           |
| Rol            | Instrumentación y transporte | Almacenamiento y consulta |
| Vendor         | Agnóstico                    | Ecosistema propio         |
| Almacenamiento | No incluye backend propio    | Incluye TSDB              |

En resumen: OTel captura y exporta telemetría desde la app; Prometheus la almacena y consulta. Pueden usarse juntos (OTel exporta métricas a Prometheus).

---

### Los 3 Pilares de la Observabilidad

| Pilar                  | Descripción                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Trazas (Traces)**    | Registran el recorrido completo de una request a través de servicios distribuidos. Cada unidad es un _span_; el conjunto forma un _trace_. |
| **Métricas (Metrics)** | Datos numéricos agregados en el tiempo (contadores, gauges, histogramas). Ideales para dashboards y alertas.                               |
| **Logs**               | Registros textuales de eventos discretos. Proveen el mayor detalle y contexto sobre lo que ocurrió.                                        |

**OpenTelemetry aborda los tres pilares:** provee APIs y SDKs para instrumentar trazas, métricas y logs, y exportarlos mediante el protocolo OTLP.

---

### Métricas RED (Rate, Errors, Duration)

Propuestas por Tom Wilkie (Grafana Labs), son tres métricas clave para servicios orientados a requests:

| Métrica                 | Descripción                                            | Utilidad                                        |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| **Rate** (Tasa)         | Requests por segundo que recibe el servicio            | Detectar picos de tráfico, planificar capacidad |
| **Errors** (Errores)    | Porcentaje/tasa de requests que fallan (5xx, timeouts) | Detectar degradación, definir SLOs              |
| **Duration** (Duración) | Distribución del tiempo de respuesta (p50/p95/p99)     | Detectar lentitud, cumplir SLAs de latencia     |

Responden a: _"¿Está el servicio funcionando bien para sus usuarios?"_

---

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo de transporte estándar de OTel. Transmite telemetría (trazas, métricas, logs) vía gRPC o HTTP/JSON entre la app instrumentada y un backend o collector.

| Aspecto                 | Exportar directo a Prometheus | Usar OTLP                                           |
| ----------------------- | ----------------------------- | --------------------------------------------------- |
| Tipos de datos          | Solo métricas                 | Trazas + Métricas + Logs                            |
| Modelo                  | Pull (Prometheus scrapea)     | Push (app envía datos)                              |
| Flexibilidad de backend | Solo Prometheus/compatible    | Cualquier backend (Jaeger, Tempo, Loki, Datadog...) |
| Intermediario           | Ninguno                       | OTel Collector (pipeline central)                   |
| Cambio de backend       | Requiere re-instrumentar      | Solo reconfigurar el Collector                      |

La ventaja principal es el **desacoplamiento**: la app habla un único protocolo (OTLP) con el Collector, y este transforma y enruta a cualquier backend. Si mañana se cambia Prometheus por otro sistema, no hay que tocar el código de la app.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es la capa de visualización. El flujo típico es:

```mermaid
graph LR
    App["App (OTel SDK)"] -->|OTLP| Collector["OTel Collector"]
    Collector --> Prometheus["Prometheus<br/>(métricas)"]
    Collector --> Tempo["Grafana Tempo<br/>(trazas)"]
    Collector --> Loki["Grafana Loki<br/>(logs)"]
    Prometheus --> Grafana["Grafana<br/>(visualización)"]
    Tempo --> Grafana
    Loki --> Grafana
```

- Las **métricas** se almacenan en Prometheus/Mimir y Grafana las consulta con PromQL.
- Las **trazas** se almacenan en Grafana Tempo y se visualizan en el explorador de trazas.
- Los **logs** se almacenan en Grafana Loki y se consultan con LogQL.

Grafana unifica los tres pilares y permite correlacionarlos: desde un pico de errores en una métrica, navegar a las trazas del período afectado, y de ahí a los logs del pod correspondiente. Grafana Alloy es una distribución basada en OTel Collector que facilita aún más la integración.
