# Fase 2: Especificar y diseñar

## Tabla de contenidos

- [2.1 Diseño de infraestructura Docker](#21-diseño-de-la-infraestructura-docker)
    - [Dockerfile API](#a-packagesapiDockerfileprod)
    - [Dockerfile Web](#b-packageswebDockerfileprod)
    - [Docker Compose producción](#c-docker-composeprodyml)
- [2.2 Diseño de la observabilidad](#22-diseño-de-la-observabilidad)
    - [a) Métricas RED](#a-métricas-red-a-capturar)
    - [b) OpenTelemetry SDK](#b-opentelemetry-sdk)
    - [c) Dashboard RED en Grafana](#c-dashboard-red-en-grafana)

## 2.1. Diseño de la infraestructura Docker

---

### a) `packages/api/Dockerfile.prod`

#### Propósito

Construir una imagen de producción para la API Node.js/TypeScript que sea segura, liviana y sin herramientas de desarrollo. La imagen actual (`packages/api/Dockerfile`) instala todas las dependencias (incluyendo devDependencies), copia el monorepo entero y ejecuta el servidor con `tsx watch`, lo cual es completamente inapropiado para producción.

#### Estructura — Multi-stage build con 3 etapas

Un multi-stage build divide la construcción de la imagen en varias etapas. Las primeras etapas contienen herramientas de compilación y dependencias de desarrollo, mientras que la etapa final contiene únicamente lo necesario para ejecutar la aplicación. Esto reduce el tamaño de la imagen y disminuye la superficie de ataque.

| Etapa   | Nombre    | Base             | Propósito                                                                                                                         |
| ------- | --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Stage 1 | `deps`    | `node:20-alpine` | Instalar todas las dependencias (`npm ci`) para poder compilar TypeScript                                                         |
| Stage 2 | `build`   | `node:20-alpine` | Compilar TypeScript con `tsc`, generar JS en `/dist`                                                                              |
| Stage 3 | `runtime` | `node:20-alpine` | Copiar solo el JS compilado + reinstalar únicamente dependencias de producción (`npm ci --omit=dev`) + correr con usuario no-root |

> Se mantiene `node:20-alpine` para ser consistente con el proyecto actual. El `--omit=dev` se aplica recién en el Stage 3 (runtime), no en Stage 1, porque TypeScript y sus tipos son devDependencies necesarias para compilar en Stage 2.

**Flujo de capas dentro de cada stage:**

```
Stage 1 (deps):
  COPY package*.json + packages/*/package.json  ← permite cache si no cambia el lock
  RUN npm ci                                    ← instala todo, incluyendo devDeps para build

Stage 2 (build):
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN npm run build -w packages/api             ← tsc genera /dist

Stage 3 (runtime):
  COPY package*.json + packages/*/package.json
  RUN npm ci --omit=dev                         ← solo dependencias de producción
  COPY --from=build /app/packages/api/dist ./dist
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  USER appuser
  HEALTHCHECK ...
  CMD ["node", "dist/app.js"]
```

#### Requisitos no funcionales

| Requisito                             | Valor                                                                                                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tamaño máximo de imagen               | Reducción esperada ≥ 70% respecto a la imagen de desarrollo. El valor real se medirá en Fase 4.                                                                                                                            |
| Usuario de ejecución                  | `appuser` (no-root)                                                                                                                                                                                                        |
| Dependencias de desarrollo en runtime | Ninguna — `typescript`, `tsx`, `@types/*` no deben estar en el Stage 3                                                                                                                                                     |
| Healthcheck                           | Verificación contra `http://localhost:3000/health` mediante `curl` o `wget` según las utilidades disponibles en la imagen final, interval 30s, timeout 5s, retries 3. Requiere incorporar un endpoint `/health` en la API. |
| `.dockerignore`                       | Debe excluir: `node_modules`, `.git`, `dist`, `*.md`, `.env*`, `coverage`                                                                                                                                                  |
| Puerto expuesto                       | `3000`                                                                                                                                                                                                                     |

---

### b) `packages/web/Dockerfile.prod`

#### Propósito

Construir una imagen de producción para el frontend React/Vite. La imagen actual usa el servidor de desarrollo de Vite (`npm run dev --host`), que no está diseñado para servir tráfico real en producción. El Stage 3 reemplaza Node.js por nginx, que es mucho más eficiente para servir archivos estáticos.

#### Estructura — Multi-stage build con 3 etapas

Un multi-stage build divide la construcción de la imagen en varias etapas. Las primeras etapas contienen herramientas de compilación y dependencias de desarrollo, mientras que la etapa final contiene únicamente lo necesario para ejecutar la aplicación. En este caso el Stage 3 ni siquiera usa Node.js — reemplaza todo por nginx, que es mucho más liviano para servir archivos estáticos.

| Etapa   | Nombre    | Base                  | Propósito                                                        |
| ------- | --------- | --------------------- | ---------------------------------------------------------------- |
| Stage 1 | `deps`    | `node:20-alpine`      | Instalar dependencias de frontend                                |
| Stage 2 | `build`   | `node:20-alpine`      | Ejecutar `vite build`, generar `/dist` con assets compilados     |
| Stage 3 | `runtime` | `nginx:stable-alpine` | Servir el `/dist` estático con nginx configurado para producción |

**Flujo de capas dentro de cada stage:**

```
Stage 1 (deps):
  COPY package*.json + packages/web/package.json
  RUN npm ci

Stage 2 (build):
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN npm run build -w packages/web     ← genera /packages/web/dist

Stage 3 (runtime):
  COPY --from=build /app/packages/web/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  HEALTHCHECK ...
```

#### Configuración nginx

nginx es el servidor web que reemplaza al servidor de desarrollo de Vite en producción. A diferencia de `vite dev`, nginx está diseñado para servir archivos estáticos de forma eficiente bajo carga real. La configuración se define en un archivo `nginx.conf` que se copia al contenedor en el Stage 3.

**Compresión gzip**

Cuando el navegador pide un archivo JS (que puede pesar 500KB), nginx lo comprime antes de enviarlo y llega como ~150KB. El navegador lo descomprime automáticamente. Esto reduce significativamente el tiempo de carga sin ningún cambio en el código. Se activa para los tipos de contenido: JS, CSS, HTML, JSON y SVG.

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
```

**Cache de assets**

Vite genera archivos con un hash en el nombre: `main-a3f9c2.js`. Ese hash cambia solo si cambia el código fuente. Por eso podemos decirle al navegador: "guardá este archivo por 1 año, no lo vuelvas a pedir". Si el código cambia en el próximo deploy, el hash cambia, el nombre del archivo cambia, y el navegador lo descarga de nuevo automáticamente.

```nginx
location /assets/ {
    add_header Cache-Control "max-age=31536000, immutable";
}
```

**Security headers**

Son cabeceras HTTP que le indican al navegador cómo protegerse contra ataques comunes:

| Header                   | Valor                             | Qué previene                                                                                  |
| ------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `X-Frame-Options`        | `DENY`                            | Evita que la app sea embebida en un `<iframe>` de otro sitio (clickjacking)                   |
| `X-Content-Type-Options` | `nosniff`                         | El navegador no intenta "adivinar" el tipo de archivo, confía solo en lo que dice el servidor |
| `X-XSS-Protection`       | `1; mode=block`                   | Activa la protección XSS del navegador ante scripts inyectados                                |
| `Referrer-Policy`        | `strict-origin-when-cross-origin` | Controla qué URL se envía como `Referer` en los requests hacia otros dominios                 |

**SPA fallback**

React maneja las rutas en el cliente (React Router). Cuando el usuario entra directamente a `/member/123`, nginx no tiene ese archivo en disco y sin configuración extra devolvería un 404. Con el fallback, nginx dice: "si no encuentro el archivo, devolvé `index.html`" y React Router se encarga de renderizar la ruta correcta.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### Requisitos no funcionales

| Requisito               | Valor                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Tamaño máximo de imagen | Reducción esperada ≥ 70% respecto a la imagen de desarrollo. El valor real se medirá en Fase 4.                                      |
| Servidor HTTP           | nginx (no Node.js)                                                                                                                   |
| Healthcheck             | Verificación contra `http://localhost:80` mediante `curl` o `wget` según las utilidades disponibles en la imagen final, interval 30s |
| Puerto expuesto         | `80`                                                                                                                                 |
| Node.js en runtime      | No debe existir — Stage 3 es solo nginx                                                                                              |

---

### c) `docker-compose.prod.yml`

#### Propósito

Orquestar los tres servicios (`api`, `web`, `db`) para producción con configuraciones de seguridad, resource limits, healthchecks y logging adecuados. El `docker-compose.yml` actual tiene múltiples problemas: credenciales hardcodeadas en el YAML, volúmenes que montan el código fuente del host (inapropiado en prod), sin límites de recursos y sin red personalizada.

#### Diseño por aspecto

**`read_only: true`**

El filesystem del contenedor queda en modo lectura. El proceso no puede crear ni modificar archivos. Si alguien explota una vulnerabilidad en la app e intenta escribir un script malicioso dentro del contenedor, no puede. Es una capa de defensa adicional que no afecta el funcionamiento normal de la aplicación.

**`tmpfs`**

Al activar `read_only: true`, cualquier path donde el proceso necesite escribir debe montarse como `tmpfs` (memoria RAM). Para la API: `/tmp` (Node.js puede escribir archivos temporales ahí). Para nginx: `/var/cache/nginx` (cache interno) y `/var/run` (archivo PID del proceso). Cuando el contenedor se detiene, esa memoria se libera automáticamente.

**`cap_drop: ALL` y `cap_add: NET_BIND_SERVICE`**

Linux tiene un sistema de "capabilities": permisos especiales del kernel que van más allá del usuario. Por ejemplo, `CAP_NET_RAW` permite hacer ping, `CAP_SYS_ADMIN` permite montar filesystems, `CAP_CHOWN` permite cambiar el dueño de archivos. Por defecto Docker asigna ~14 capabilities a cada contenedor. Con `cap_drop: ALL` las eliminamos todas, y con `cap_add: NET_BIND_SERVICE` devolvemos únicamente la que necesitamos: poder escuchar en puertos menores a 1024 (como el puerto 80 de nginx). El resto de servicios que escuchan en puertos altos (3000, 5432) no necesitan ni esa.

**`security_opt: no-new-privileges:true`**

Evita que el proceso o sus hijos puedan escalar privilegios usando bits `setuid` o `setgid`. Aunque alguien logre ejecutar código arbitrario dentro del contenedor, no puede convertirse en root.

**`env_file: .env`**

En lugar de escribir `POSTGRES_PASSWORD=password123` directamente en el YAML (que va al repositorio), las variables sensibles se leen de un archivo `.env` que está en `.gitignore`. El YAML solo referencia el archivo, nunca contiene las credenciales en texto plano.

**`networks: alentapp-network`**

Por defecto Docker conecta todos los contenedores a una red compartida llamada `bridge`. Con una red personalizada, los servicios de este proyecto están aislados: solo pueden verse entre ellos por nombre de servicio (`api`, `db`, `web`) y no tienen visibilidad de otros contenedores que puedan estar corriendo en el mismo host.

**`deploy.resources`**

Sin límites, si la API tiene un memory leak puede consumir toda la RAM del servidor y tirar los demás servicios. Con `limits` se define el máximo que puede usar cada servicio. Con `reservations` se garantiza que esa cantidad siempre esté disponible para él.

#### Tabla resumen de aspectos

| Aspecto             | Requisito                                                                                               | Justificación                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Resource limits** | CPU y memoria definidos por servicio via `deploy.resources`                                             | Evita que un servicio consuma todos los recursos del host    |
| **Healthchecks**    | Para `api` y `db`                                                                                       | Permite gestionar dependencias entre servicios correctamente |
| **Seguridad**       | `read_only: true`, `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`, `security_opt: no-new-privileges:true` | Principio de mínimo privilegio                               |
| **Logging**         | Driver `json-file`, `max-size: 10m`, `max-file: 3`                                                      | Evita que los logs llenen el disco del host                  |
| **Red**             | Red interna personalizada `alentapp-network`                                                            | Aislamiento entre servicios                                  |
| **Secrets**         | Variables sensibles desde `.env` via `env_file`                                                         | Credenciales fuera del repositorio                           |

#### Límites de recursos propuestos por servicio

| Servicio | CPU limit | Memoria limit | Memoria reservation |
| -------- | --------- | ------------- | ------------------- |
| `api`    | `0.5`     | `512m`        | `256m`              |
| `web`    | `0.25`    | `128m`        | `64m`               |
| `db`     | `1.0`     | `1g`          | `512m`              |

#### Diferencias clave respecto al compose de desarrollo

| Característica       | Desarrollo                       | Producción                               |
| -------------------- | -------------------------------- | ---------------------------------------- |
| Volúmenes de código  | Montaje live del host (`.:/app`) | Solo volumen para datos de DB (`pgdata`) |
| Comando API          | `tsx watch` (hot reload)         | `node dist/app.js` (JS compilado)        |
| Comando Web          | `vite dev --host`                | nginx sirviendo assets estáticos         |
| Variables de entorno | Hardcodeadas en el YAML          | Desde archivo `.env` via `env_file`      |
| Red                  | Default bridge                   | Red personalizada `alentapp-network`     |
| Filesystem           | Read-write                       | `read_only: true` para api y web         |
| Resource limits      | Ninguno                          | Definidos por servicio                   |
| Capabilities         | Todas (default)                  | `cap_drop: ALL` + solo las necesarias    |

#### Estructura de servicios

```yaml
services:
    db:
        image: postgres:16-alpine
        env_file: .env
        volumes:
            - pgdata:/var/lib/postgresql/data
        healthcheck:
            test: pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
            interval: 10s
            timeout: 5s
            retries: 5
        networks: [alentapp-network]
        logging:
            driver: json-file
            options:
                max-size: '10m'
                max-file: '3'
        deploy:
            resources:
                limits: { cpus: '1.0', memory: 1g }
                reservations: { memory: 512m }

    api:
        build:
            context: .
            dockerfile: packages/api/Dockerfile.prod
        env_file: .env
        read_only: true
        cap_drop: [ALL]
        cap_add: [NET_BIND_SERVICE]
        security_opt: [no-new-privileges:true]
        tmpfs: [/tmp]
        depends_on:
            db: { condition: service_healthy }
        healthcheck:
            test: curl -f http://localhost:3000/health || wget -qO- http://localhost:3000/health || exit 1
            interval: 30s
            timeout: 5s
            retries: 3
        networks: [alentapp-network]
        ports:
            - '3000:3000'
            - '9464:9464' # métricas OpenTelemetry
        logging:
            driver: json-file
            options:
                max-size: '10m'
                max-file: '3'
        deploy:
            resources:
                limits: { cpus: '0.5', memory: 512m }
                reservations: { memory: 256m }

    web:
        build:
            context: .
            dockerfile: packages/web/Dockerfile.prod
        read_only: true
        cap_drop: [ALL]
        cap_add: [NET_BIND_SERVICE]
        security_opt: [no-new-privileges:true]
        tmpfs:
            - /var/cache/nginx
            - /var/run
        depends_on:
            api: { condition: service_healthy }
        networks: [alentapp-network]
        ports:
            - '80:80'
        logging:
            driver: json-file
            options:
                max-size: '10m'
                max-file: '3'
        deploy:
            resources:
                limits: { cpus: '0.25', memory: 128m }
                reservations: { memory: 64m }

networks:
    alentapp-network:
        driver: bridge

volumes:
    pgdata:
```

---

## 2.2. Diseño de la observabilidad

OpenTelemetry es un estándar abierto para instrumentar aplicaciones y recolectar señales de observabilidad. A diferencia de Prometheus, que es una herramienta específica de métricas con su propio formato, OpenTelemetry es agnóstico al backend: puede exportar datos a distintos sistemas de observabilidad como Prometheus, Jaeger, Tempo o Datadog sin modificar la instrumentación de la aplicación. En este proyecto se utiliza OpenTelemetry para instrumentar la API y exponer métricas en formato Prometheus. Prometheus recolecta dichas métricas mediante scraping y Grafana las consulta posteriormente para su visualización.

---

### a) Métricas RED a capturar

El método RED define las 3 métricas fundamentales para monitorear servicios HTTP. El nombre viene de sus iniciales: **R**ate, **E**rrors, **D**uration.

- **Rate**: cuántas requests por segundo está recibiendo el servicio. Permite detectar picos de tráfico o caídas inesperadas.
- **Errors**: cantidad de requests que terminan en error (4xx o 5xx). A partir de esta métrica puede calcularse posteriormente la tasa de error porcentual.
- **Duration**: cuánto tarda cada request en resolverse. Permite detectar degradación de performance incluso cuando no hay errores.
  Las tres métricas juntas dan una visión completa del estado del servicio desde la perspectiva del usuario.

#### Métricas a implementar

| Métrica                 | Tipo OpenTelemetry | Descripción                                                   | Labels                      |
| ----------------------- | ------------------ | ------------------------------------------------------------- | --------------------------- |
| `http.requests.total`   | `Counter`          | Total acumulado de requests HTTP recibidos                    | `method`, `route`, `status` |
| `http.requests.errors`  | `Counter`          | Total acumulado de requests que terminaron en error (4xx/5xx) | `method`, `route`, `status` |
| `http.request.duration` | `Histogram`        | Distribución de latencias de cada request en milisegundos     | `method`, `route`           |
| `process.memory.usage`  | `ObservableGauge`  | Memoria heap utilizada por el proceso Node.js en bytes        | —                           |
| `http.requests.active`  | `UpDownCounter`    | Cantidad de requests siendo procesadas en este momento        | `method`, `route`           |

**¿Por qué estos tipos?**

- `Counter`: solo sube, nunca baja. Ideal para contar eventos acumulados como requests o errores. En Prometheus se usa `rate()` para obtener la tasa por segundo.
- `Histogram`: agrupa las mediciones en rangos (buckets). Permite calcular percentiles como p95 o p99, que son más útiles que el promedio para medir latencia.
- `ObservableGauge`: variante del Gauge que se actualiza automáticamente mediante un callback cada vez que Prometheus scrapea. Ideal para valores que el sistema ya calcula internamente, como la memoria del proceso.
- `UpDownCounter`: variante del Counter que permite decrementar. Se usa para `http.requests.active` porque cuando una request termina hay que restarla.

**¿Por qué estos labels?**

- `method`: distingue GET de POST, DELETE, etc.
- `route`: distingue `/api/v1/members` de `/api/v1/sports`. Sin esto, todas las requests se mezclan en una sola métrica.
- `status`: permite filtrar solo los errores (4xx/5xx) o solo los éxitos (2xx).

---

### b) OpenTelemetry SDK

El SDK de OpenTelemetry debe inicializarse antes que cualquier otro módulo de la aplicación. Esto es crítico porque las auto-instrumentaciones funcionan interceptando los módulos en el momento en que se cargan. Si Fastify o el cliente HTTP se cargan antes que el SDK, no quedan instrumentados.

#### Estructura del archivo `packages/api/src/infrastructure/telemetry.ts`

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics } from '@opentelemetry/api';

// 1. Configurar el exportador Prometheus
// Expone las métricas en http://localhost:9464/metrics
// Prometheus las recolecta ("scrapea") cada 15 segundos desde ese endpoint
const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
});

// 2. Crear e iniciar el SDK
// Las auto-instrumentaciones instrumentan automáticamente las operaciones HTTP y Fastify
// para trazas y atributos. Las métricas RED se implementan manualmente para tener
// control sobre nombres, labels y agregaciones.
const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-http': {},
            '@opentelemetry/instrumentation-fastify': {},
        }),
    ],
});

sdk.start();

// 3. Crear los instrumentos RED como singletons exportados
// Se crean una sola vez a nivel de módulo y se reutilizan en todos los controllers.
// Crear instrumentos nuevos por cada request o por cada controller generaría
// conflictos de registro en el MeterProvider.
const meter = metrics.getMeter('alentapp-api');

export const requestCounter = meter.createCounter('http.requests.total', {
    description: 'Total de requests HTTP recibidos',
});

export const errorCounter = meter.createCounter('http.requests.errors', {
    description: 'Total de requests HTTP que terminaron en error',
});

export const requestDuration = meter.createHistogram('http.request.duration', {
    description: 'Duración de cada request HTTP',
    unit: 'ms',
});

export const activeRequestsCounter = meter.createUpDownCounter(
    'http.requests.active',
    {
        description: 'Requests siendo procesadas en este momento',
    },
);

// ObservableGauge: se actualiza automáticamente mediante callback cada vez que Prometheus scrapea
const memoryGauge = meter.createObservableGauge('process.memory.usage', {
    description: 'Memoria heap utilizada por el proceso Node.js',
    unit: 'bytes',
});
memoryGauge.addCallback((result) => {
    result.observe(process.memoryUsage().heapUsed);
});

export { sdk };
```

#### Inicialización en el entrypoint

En `packages/api/src/app.ts`, el import de telemetría debe ser el primero:

```typescript
// PRIMERO: inicializar OpenTelemetry antes de cualquier otro import
import './infrastructure/telemetry.js';

// Recién después el resto
import Fastify from 'fastify';
// ...
```

#### Uso en los controllers

Los instrumentos se importan directamente desde `telemetry.ts` — no se crean nuevos por controller:

```typescript
import { requestCounter, errorCounter, requestDuration, activeRequestsCounter } from '../infrastructure/telemetry.js';

async getAll(request, reply) {
  const start = Date.now();
  const method = request.method;
  // Se usa routeOptions.url para obtener el template de ruta (/members/:id)
  // en lugar de request.url, que generaría cardinalidad infinita
  // (/members/1, /members/2, /members/3 serían 3 series distintas en Prometheus)
  const route = request.routeOptions?.url ?? request.url.split('?')[0];

  activeRequestsCounter.add(1, { method, route });

  try {
    const members = await this.getMembersUseCase.execute();
    requestCounter.add(1, { method, route, status: '200' });
    return reply.status(200).send({ data: members });
  } catch (error) {
    errorCounter.add(1, { method, route, status: '500' });
    return reply.status(500).send({ error: 'Error interno' });
  } finally {
    requestDuration.record(Date.now() - start, { method, route });
    activeRequestsCounter.add(-1, { method, route });
  }
}
```

#### Dependencias a instalar

```bash
npm -w packages/api install \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-prometheus \
  @opentelemetry/instrumentation-http \
  @opentelemetry/instrumentation-fastify
```

---

### c) Dashboard RED en Grafana

El dashboard se llama "RED — Alentapp API" y tiene 6 paneles. Cada panel usa una consulta PromQL que transforma las métricas crudas en algo legible.

**¿Qué es PromQL?** Es el lenguaje de consulta de Prometheus. Funciona sobre series de tiempo: cada métrica tiene un valor que cambia a lo largo del tiempo, y PromQL permite calcular tasas, percentiles, sumas y filtrar por labels.

#### Paneles del dashboard

| #   | Nombre                       | Tipo                 | Consulta PromQL                                                                                               | Propósito                                                                                                                                                  |
| --- | ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Requests por segundo         | Time series          | `rate(http_requests_total[1m])`                                                                               | Ver el tráfico actual. `rate()` calcula cuántos incrementos por segundo hubo en el último minuto.                                                          |
| 2   | Tasa de error (%)            | Time series          | `sum(rate(http_requests_errors_total[1m])) / sum(rate(http_requests_total[1m])) * 100`                        | Porcentaje de requests con error. Si sube por encima del 1-2% hay un problema.                                                                             |
| 3   | Latencia p95 / p99           | Time series          | `histogram_quantile(0.95, sum(rate(http_request_duration_bucket[5m])) by (le))`                               | El 95% de las requests tarda menos que este valor. Más útil que el promedio porque el promedio oculta los casos lentos.                                    |
| 4   | Distribución por status code | Stacked area         | `sum by (status) (rate(http_requests_total[5m]))`                                                             | Ver de un vistazo cuántos 2xx, 4xx y 5xx hay. El área apilada muestra la proporción entre ellos.                                                           |
| 5   | Memoria del proceso          | Time series          | `process_memory_usage_bytes / 1024 / 1024`                                                                    | Consumo de memoria en MB. Si sube constantemente sin bajar puede indicar un memory leak.                                                                   |
| 6   | Endpoints más lentos (top 5) | Bar chart horizontal | `topk(5, avg by (route) (rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])))` | Latencia promedio por endpoint. Se divide `_sum` por `_count` porque `http.request.duration` es un Histogram — no existe directamente como valor promedio. |

#### ¿Por qué OpenTelemetry y no métricas manuales?

OpenTelemetry permite desacoplar la instrumentación del backend de observabilidad. La aplicación genera métricas usando APIs estándar y puede exportarlas a Prometheus, Grafana, Datadog o cualquier backend compatible sin modificar el código de instrumentación. Esto evita dependencia directa con una herramienta específica y facilita futuras migraciones.

#### Flujo de datos completo

```
API (Node.js)
  └── OpenTelemetry SDK instrumenta cada request
       └── PrometheusExporter expone métricas en :9464/metrics
            └── Prometheus scrapea ese endpoint cada 15s
                 └── Grafana consulta Prometheus con PromQL
                      └── Dashboard muestra los 6 paneles en tiempo real
```

El dashboard se puede definir como código exportando el JSON desde la UI de Grafana y guardándolo en `observability/grafana/dashboards/red-metrics.json`, lo que permite versionarlo en el repositorio y recrearlo automáticamente en cualquier entorno.
