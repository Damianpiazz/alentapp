# Fase 3 — Decisiones Técnicas

## 1. Centralización de métricas vía Fastify hooks

### Decisión

Se eliminaron todas las métricas de los 6 controllers (~150 líneas de boilerplate) y se reemplazaron por 3 hooks de Fastify en `app.ts`:

| Hook         | Propósito                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onRequest`  | Registra `startTime`, calcula raw URL, **incrementa** `activeRequestsCounter`                                                                           |
| `preHandler` | Actualiza `__metrics_route` con `request.routeOptions?.url` (template)                                                                                  |
| `onResponse` | Calcula duración, **decrementa** `activeRequestsCounter`, registra `requestCounter`/`errorCounter` según `reply.statusCode`, registra `requestDuration` |

### Impacto

- **Elimina código duplicado**: antes cada handler repetía `const start = Date.now()`, `const method = request.method`, `const route = ...`, `activeRequestsCounter.add(1/-1)`, `requestDuration.record(...)`, etc.
- **Fija cardinalidad infinita**: usa `request.routeOptions?.url` que devuelve el template (`/socios/:id`), no la URL concreta (`/socios/123`).
- **Fija bug**: `EquipmentLoanController.getAll` no tenía `activeRequestsCounter.add(-1)` en el finally. Con hooks, el decremento está garantizado para todos los requests.

### Ventajas

- Centralizado y mantenible — si cambia la lógica de métricas, se toca un solo archivo (`app.ts`).
- `activeRequestsCounter` balanceado: incremento y decremento usan el mismo label (raw URL), evitando fugas en el UpDownCounter.
- RED metrics (requestCounter, errorCounter, requestDuration) usan route template, evitando cardinalidad infinita en Prometheus.

### Desventajas

- El tiempo de `requestDuration` ahora incluye overhead de hooks y middleware (más realista).
- No se distingue entre 4xx y 5xx para `errorCounter` — se usa `>= 400` para mantener consistencia con el comportamiento anterior.

---

## 2. Eliminación de `createREDMetrics(meter)`

### Decisión

Se eliminó la función `createREDMetrics` y los counters se exportan directamente desde `telemetry.ts`.

### Impacto

- **Antes**: cada controller llamaba `createREDMetrics(meter)`, creando su propia instancia de cada counter.
- **Después**: `requestCounter`, `errorCounter`, `requestDuration` se crean una sola vez y se exportan como singletons.

### Ventajas

- Una sola instancia de cada métrica por proceso.
- Elimina la dependencia de `meter` en los controllers (era un gotcha — todos los controllers compartían el mismo meter pero cada uno creaba counters nuevos).
- Coincide con el patrón de `activeRequestsCounter` y `memoryGauge` que ya eran singletons.

### Desventajas

- Ninguna.

---

## 3. Graceful shutdown del SDK de OpenTelemetry

### Decisión

Se agregó `sdk.shutdown()` en los handlers de `SIGINT`/`SIGTERM` en `app.ts`, antes del `process.exit(0)`.

### Impacto

- **Antes**: al recibir SIGTERM, el proceso cerraba el server y salía inmediatamente, perdiendo cualquier métrica pendiente en el buffer del PrometheusExporter.
- **Después**: `sdk.shutdown()` fuerza el flush de todas las métricas pendientes antes de terminar.

### Ventajas

- No se pierden métricas al hacer deploy o escalar.
- Cumple con la [best practice de OpenTelemetry](https://opentelemetry.io/docs/languages/js/instrumentation/#shutdown).

### Desventajas

- Agrega latencia al shutdown (~100-500ms), imperceptible en producción.

---

## 4. Dashboard RED con datasource referenciado

### Decisión

Cada panel del dashboard especifica `datasource: { type: "prometheus", uid: "prometheus" }`.

### Impacto

- **Antes**: al importar el JSON en Grafana, cada panel quedaba sin datasource y había que asignarlo manualmente.
- **Después**: el dashboard se conecta automáticamente al datasource Prometheus configurado con UID `prometheus`.

### Ventajas

- Import reproducible y sin pasos manuales.
- El provisioning de Grafana (ver punto 5) usa el mismo UID.

### Desventajas

- El UID debe coincidir entre el dashboard y el datasource provisionado.

---

## 5. Provisioning automático de Grafana

### Decisión

Se crearon archivos de provisioning:

- `observability/grafana/provisioning/datasources/datasources.yml` — define datasource Prometheus apuntando a `prometheus:9090`
- `observability/grafana/provisioning/dashboards/dashboards.yml` — carga automática de dashboards desde `/var/lib/grafana/dashboards`

### Impacto

- Grafana carga el datasource y el dashboard automáticamente al iniciar.
- No requiere configuración manual post-deploy.

### Ventajas

- Infrastructure as Code: reproducible y versionado.
- Cero configuración manual.
- Despliegue idempotente.

### Desventajas

- Requiere montar los volúmenes en el servicio Grafana en `docker-compose.observability.yml`.

---

## 6. Panel de Requests Activos en el dashboard

### Decisión

Se agregó un panel 4 (`timeseries`) para la métrica `http_requests_active`.

### Impacto

- El dashboard ahora muestra 7 paneles: Rate, Error %, Latencia p95/p99, Requests Activos, Distribución por status, Memoria, Endpoints lentos.

### Ventajas

- Visibilidad inmediata de saturación concurrente.
- Correlación con picos de latencia y errores.

### Desventajas

- Ninguna.

---

## Resumen de archivos modificados/creados

| Archivo                                                          | Cambio                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `packages/api/src/infrastructure/telemetry.ts`                   | − `createREDMetrics()`, + export directo de `requestCounter`, `errorCounter`, `requestDuration`, + type `ObservableResult` |
| `packages/api/src/app.ts`                                        | + import de counters y sdk, + 3 hooks (onRequest, preHandler, onResponse), + `sdk.shutdown()` en SIGTERM                   |
| `packages/api/src/delivery/MemberController.ts`                  | − comentario (líneas 8-16), − imports de métricas, − todo el código de métricas                                            |
| `packages/api/src/delivery/SportController.ts`                   | − imports de métricas, − todo el código de métricas                                                                        |
| `packages/api/src/delivery/PaymentController.ts`                 | − imports de métricas, − todo el código de métricas                                                                        |
| `packages/api/src/delivery/LockerController.ts`                  | − imports de métricas, − todo el código de métricas                                                                        |
| `packages/api/src/delivery/EquipmentLoanController.ts`           | − imports de métricas, − todo el código de métricas (bug de `getAll` se arregla automáticamente)                           |
| `packages/api/src/delivery/DisciplineController.ts`              | − imports de métricas, − todo el código de métricas                                                                        |
| `observability/grafana/dashboards/red-metrics.json`              | + `datasource` en cada panel, + panel `http_requests_active`                                                               |
| `observability/grafana/provisioning/datasources/datasources.yml` | **Nuevo** — datasource Prometheus provisionado                                                                             |
| `observability/grafana/provisioning/dashboards/dashboards.yml`   | **Nuevo** — provider de dashboards automático                                                                              |
