# Análisis de Infraestructura Docker: Fase 1

**Archivos analizados:**

- `docker-compose.yml`
- `packages/api/Dockerfile`
- `packages/web/Dockerfile`

---

## 1.1. Problemas y Vulnerabilidades en la Configuración Docker

### Tabla de Problemas Identificados

| #   | Problema                                                                                | ¿Dónde ocurre?                                                                                                                               | Impacto | Solución propuesta                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Credenciales hardcodeadas en texto plano                                                | `docker-compose.yml` líneas 6–8 y variable `DATABASE_URL` línea 28                                                                           | Alto    | Usar variables de entorno externas con un archivo `.env` (no commiteado) y referenciarlas con `${VAR}`. En producción, usar Docker Secrets o un gestor de secretos (Vault, AWS Secrets Manager).                                                                                            |
| 2   | Contenedores corren como root                                                           | `packages/api/Dockerfile` y `packages/web/Dockerfile` (ausencia de directiva `USER`)                                                         | Alto    | Agregar al Dockerfile un usuario sin privilegios: `RUN addgroup -S appgroup && adduser -S appuser -G appgroup` seguido de `USER appuser` antes del `CMD`.                                                                                                                                   |
| 3   | Caché de capas invalidada por dependencias ajenas al paquete                            | `packages/api/Dockerfile` línea 8: copia el `package.json` de `web` antes del `npm install`, siendo que la API no depende del frontend       | Bajo    | Eliminar el `COPY packages/web/package.json` del Dockerfile de la API. Cada Dockerfile solo debería copiar los `package.json` de los paquetes que realmente utiliza, para que cambios en el frontend no invaliden el caché de la API.                                                       |
| 4   | Sin límites de recursos (CPU/memoria) y sin healthchecks en API y Web                   | `docker-compose.yml`, servicios `api` y `web` carecen de `deploy.resources` y `healthcheck`                                                  | Medio   | Agregar bloques `deploy.resources.limits` (ej. `memory: 512m`, `cpus: '0.5'`) y definir `healthcheck` con `curl` o `wget` al endpoint `/health` de cada servicio para que el orquestador pueda detectar fallos.                                                                             |
| 5   | Imagen base pesada y sin multi-stage build; dependencias de dev incluidas en producción | `packages/api/Dockerfile` y `packages/web/Dockerfile`: single-stage, `npm install` instala todas las dependencias incluyendo devDependencies | Medio   | Implementar multi-stage build: una etapa `builder` que instala todo y compila, y una etapa `runner` que parte de `node:20-alpine` limpia y copia solo el artefacto compilado + dependencias de producción (`npm ci --omit=dev`). Esto reduce el tamaño de imagen y la superficie de ataque. |

---

### Detalle de cada problema

#### Problema 1: Credenciales hardcodeadas

```yaml
# docker-compose.yml (líneas 6–8)
environment:
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: password123 # ← expuesta en el repositorio
    POSTGRES_DB: alentapp_db
```

Las credenciales commiteadas en el repositorio son una de las vulnerabilidades más frecuentes y graves en proyectos reales. El problema no es solo que alguien las vea hoy: Git guarda el historial completo, entonces aunque en el futuro se cambie el archivo, las credenciales van a seguir visibles en commits anteriores. Cualquier persona con acceso al repo (un colaborador, alguien que lo forkea, o un atacante que accede al servidor de Git) obtiene acceso directo a la base de datos de producción.

En este proyecto ocurre en dos lugares: las variables de entorno de Postgres en el servicio `db` (líneas 6–8) y la `DATABASE_URL` del servicio `api` (línea 28), que contiene usuario y contraseña en texto plano dentro de la URL de conexión.

**Solución:**

La práctica estándar es usar un archivo `.env` que viva en la máquina pero nunca se commitee al repositorio. Docker Compose lo levanta automáticamente si está en la misma carpeta. Las variables siguen declaradas en el compose, pero sus valores vienen del `.env`:

```yaml
# .env  ← este archivo va en .gitignore, nunca al repo
POSTGRES_USER=admin
POSTGRES_PASSWORD=s3cur3P@ssw0rd
POSTGRES_DB=alentapp_db
DATABASE_URL=postgres://admin:s3cur3P@ssw0rd@db:5432/alentapp_db
```

```yaml
# docker-compose.yml — los valores vienen del .env
environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
```

De esta forma el compose sigue siendo explícito (se ve qué variables espera cada servicio) pero ningún valor real está hardcodeado en el repositorio.

---

#### Problema 2: Ejecución como root

Ninguno de los dos Dockerfiles define un usuario no-privilegiado mediante la directiva `USER`. Esto significa que cuando el contenedor arranca, el proceso de Node.js corre como `root`, el usuario administrador del sistema.

El problema es que si hay una vulnerabilidad en la app o en alguna dependencia y alguien logra ejecutar código dentro del contenedor, ese código tiene permisos totales para hacer lo que quiera: leer archivos, modificar configuraciones, instalar cosas. Es la misma lógica que en cualquier sistema operativo: no usamos el usuario administrador para el día a día justamente para limitar el daño si algo sale mal.

**Solución (a agregar en ambos Dockerfiles antes del CMD):**

```dockerfile
# Creamos un grupo y un usuario sin privilegios
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Le damos pertenencia de la carpeta de trabajo a ese usuario
RUN chown -R appuser:appgroup /app

# A partir de acá todo corre como appuser, no como root
USER appuser

CMD ["node", "app.js"]
```

---

#### Problema 3: Caché de capas invalidada por dependencias ajenas al paquete

Docker construye las imágenes capa por capa y cachea cada capa. Si una capa no cambió desde el último build, Docker la reutiliza en vez de reconstruirla, haciendo los builds mucho más rápidos. La clave está en el orden: una vez que una capa cambia, todas las capas siguientes se invalidan y se reconstruyen desde cero.

El patrón correcto en un monorepo es copiar primero los `package.json`, ejecutar `npm install` (que queda cacheado mientras no cambien las dependencias), y recién después copiar el código fuente. Pero en el Dockerfile de la API hay un problema:

```dockerfile
# packages/api/Dockerfile
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/   # ← requiere validación de necesidad
RUN npm install
COPY . .
```

El Dockerfile de la API copia el archivo `packages/web/package.json` antes de ejecutar `npm install`. Sin embargo, el paquete `@alentapp/api` no declara dependencias hacia el frontend y el Dockerfile de Web tampoco necesita copiar el `package.json` de la API para resolver sus dependencias. Como consecuencia, cualquier modificación en las dependencias del frontend invalida innecesariamente la caché de instalación de la imagen de la API, forzando una reinstalación completa aunque el backend no haya cambiado.

**Solución:**

Revisar si la copia de `packages/web/package.json` es realmente necesaria para la resolución de dependencias del workspace. En caso de no serlo, eliminarla permitiría desacoplar parcialmente los procesos de build de frontend y backend y mejorar el aprovechamiento de la caché de Docker:

```dockerfile
# packages/api/Dockerfile — POSIBLE OPTIMIZACIÓN
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
# se elimina el COPY de packages/web/package.json
RUN npm install
COPY . .
```

---

#### Problema 4: Sin límites de recursos ni healthchecks en API y Web

**¿Qué es un healthcheck y para qué sirve?**

Un healthcheck es una instrucción que le dice a Docker que ejecute un comando periódicamente para verificar que el contenedor no solo está corriendo, sino que está funcionando correctamente. La diferencia es importante: un proceso puede estar activo pero completamente trabado, en un loop infinito, o con la base de datos desconectada. Docker sin healthcheck no se entera y no hace nada.

Cuando el healthcheck falla repetidamente, Docker marca el contenedor como `unhealthy`. Esto le permite a un orquestador (como Docker Swarm o Kubernetes) reiniciarlo automáticamente o dejar de enviarle tráfico.

En este proyecto, `db` sí tiene healthcheck configurado:

```yaml
healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U admin -d alentapp_db']
    interval: 5s # lo chequea cada 5 segundos
    timeout: 5s # si no responde en 5s, cuenta como fallo
    retries: 5 # si falla 5 veces seguidas → unhealthy
```

Esto es lo que permite que el servicio `api` use `condition: service_healthy` en su `depends_on`: la API espera a que la DB esté realmente lista antes de arrancar. Pero `api` y `web` no tienen su propio healthcheck, por lo que si la API se traba después de arrancar, nadie lo detecta.

**¿Qué son los límites de recursos?**

Sin límites, un contenedor puede consumir toda la CPU y memoria disponible en el host, afectando a los demás servicios. Por ejemplo, si la API tiene una fuga de memoria, puede terminar consumiendo toda la RAM del servidor.

**Solución:**

```yaml
api:
    healthcheck:
        test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3000/health']
        interval: 30s # chequear cada 30 segundos
        timeout: 10s # esperar hasta 10s la respuesta
        retries: 3 # 3 fallos consecutivos → unhealthy
        start_period: 40s # darle 40s al arranque antes de empezar a chequear
    deploy:
        resources:
            limits:
                memory: 512m # máximo 512 MB de RAM
                cpus: '0.5' # máximo 50% de un núcleo de CPU
```

El `start_period` es importante: la API necesita tiempo para arrancar (correr migraciones, conectarse a la DB), entonces le damos margen antes de empezar a contar fallos.

---

#### Problema 5: Single-stage build y dependencias de desarrollo incluidas en la imagen final

Actualmente ambos Dockerfiles tienen una sola etapa. Docker ejecuta todo en orden y lo que queda al final es la imagen que se despliega en producción:

```dockerfile
FROM node:20-alpine
RUN npm install   # instala TODO: express, prisma, typescript, tsx, @types/*, nodemon...
COPY . .
CMD ["npm", "run", "dev"]
```

El problema es que `npm install` sin flags instala tanto las dependencias de producción (`dependencies` en `package.json`) como las de desarrollo (`devDependencies`): TypeScript, tsx, nodemon, todos los `@types/*`, herramientas de testing, etc. Estas herramientas solo son necesarias durante el desarrollo y la compilación, pero terminan dentro de la imagen que corre en producción, haciéndola más pesada y con mayor superficie de ataque.

**¿Cómo funciona el multi-stage build?**

La idea es dividir el Dockerfile en etapas. Cada etapa puede partir de una imagen base diferente y copiar archivos de etapas anteriores. La imagen final solo contiene lo de la última etapa; las etapas intermedias se usan y se descartan.

```dockerfile
# ETAPA 1 — "la fábrica": tiene todo lo necesario para compilar
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci                          # instala todo, incluyendo devDependencies
COPY . .
RUN npm run build -w packages/api   # compila TypeScript → JavaScript

# ETAPA 2 — "el producto final": parte limpia, solo lo necesario para correr
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
RUN npm ci --omit=dev               # solo dependencias de producción
COPY --from=builder /app/packages/api/dist ./packages/api/dist  # solo el código compilado
USER appuser
EXPOSE 3000
CMD ["node", "packages/api/dist/app.js"]
```

La etapa `builder` existe solo para compilar. En la imagen final (`runner`) no hay TypeScript, no hay tsx, no hay herramientas de desarrollo, solo Node.js, las dependencias de producción y el código JavaScript ya compilado.

**Estado actual del proyecto y cambios necesarios para implementar esta solución:**

El proyecto no cuenta con un script de build configurado. La API corre con `tsx watch`, que transpila y ejecuta TypeScript en tiempo de ejecución sin generar previamente archivos JavaScript compilados para producción, y `tsx` está declarado como `devDependency`:

```json
"scripts": {
    "dev": "tsx watch src/app.ts"
},
"devDependencies": {
    "tsx": "^4.21.0"
}
```

Esto significa que el multi-stage build propuesto no es aplicable directamente en el estado actual del proyecto. Además, utilizar `tsx watch` como comando de producción presenta varias desventajas. `tsx watch` es una herramienta orientada al desarrollo: monitorea cambios en el sistema de archivos y reinicia automáticamente el proceso cuando detecta modificaciones. En un entorno productivo no existen cambios de código en tiempo de ejecución, por lo que ese comportamiento resulta innecesario y consume recursos adicionales. Asimismo, la aplicación depende de `tsx`, una dependencia de desarrollo, para poder ejecutarse. Esto obliga a incluir herramientas de desarrollo dentro de la imagen final y dificulta la construcción de imágenes más pequeñas y seguras. Un enfoque más apropiado consiste en compilar previamente el código TypeScript a JavaScript y ejecutar únicamente los artefactos generados.

Para implementar el multi-stage build correctamente primero hay que realizar los siguientes cambios:

**1. Agregar los scripts de build y start al `packages/api/package.json`:**

```json
"scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc --outDir dist",
    "start": "node dist/app.js"
}
```

**2. Configurar el `tsconfig.json` con el directorio de salida:**

```json
{
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src"
    }
}
```

Con estos cambios en su lugar, el Dockerfile multi-stage propuesto arriba funciona correctamente y la imagen final no necesita ni TypeScript ni `tsx` para correr.

---

## 1.2. Investigación: OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework de observabilidad open-source, neutral a proveedores, que provee APIs, SDKs y herramientas para instrumentar aplicaciones y recolectar datos de telemetría (trazas, métricas y logs). Es mantenido por la CNCF (Cloud Native Computing Foundation) y se ha convertido en el estándar de la industria para instrumentación.

**Prometheus**, en cambio, es una herramienta específica de monitoreo y alertas que se enfoca exclusivamente en métricas, usando un modelo de scraping (pull) donde Prometheus consulta periódicamente los endpoints `/metrics` de las aplicaciones.

| Aspecto        | OpenTelemetry                | Prometheus                |
| -------------- | ---------------------------- | ------------------------- |
| Scope          | Trazas + Métricas + Logs     | Solo métricas             |
| Modelo         | Push (OTLP) y Pull           | Pull (scraping)           |
| Rol            | Instrumentación y transporte | Almacenamiento y consulta |
| Vendor         | Agnóstico                    | Ecosistema propio         |
| Almacenamiento | No incluye backend           | Incluye TSDB propio       |

En resumen: OpenTelemetry se encarga de recolectar y exportar telemetría desde las aplicaciones; Prometheus (u otras herramientas) se encarga de almacenarla y consultarla. Se pueden usar juntos: OTel exporta métricas a Prometheus.

---

### Los 3 Pilares de la Observabilidad

Los tres pilares clásicos de la observabilidad son:

1. **Trazas:** Registran el recorrido completo de una request a través de los distintos servicios de un sistema distribuido. Permiten ver la cadena de llamadas, latencias por segmento y dónde ocurren los cuellos de botella. Cada unidad es un span; el conjunto forma un trace.

2. **Métricas:** Datos numéricos agregados a lo largo del tiempo. Representan el estado del sistema en forma de contadores, gauges e histogramas. Son eficientes de almacenar y consultar, ideales para dashboards y alertas.

3. **Logs:** Registros textuales de eventos discretos que ocurren en el sistema. Proveen el mayor nivel de detalle y contexto sobre qué pasó exactamente en un momento dado.

**¿Cuál aborda OpenTelemetry?** Los tres. OTel provee APIs y SDKs para instrumentar trazas, métricas y logs, y exportarlos a través del protocolo OTLP. Esto lo diferencia de herramientas anteriores que solo cubrían uno de los pilares.

---

### Métricas RED (Rate, Errors, Duration)

El método RED, propuesto por Tom Wilkie (Grafana Labs), define tres métricas clave para monitorear servicios orientados a requests:

| Métrica                 | Descripción                                                                              | ¿Para qué sirve?                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Rate** (Tasa)         | Cantidad de requests por segundo que recibe el servicio                                  | Detectar picos de tráfico, planificar capacidad, entender la carga actual |
| **Errors** (Errores)    | Porcentaje o tasa de requests que fallan (5xx, timeouts, etc.)                           | Detectar degradación del servicio, definir SLOs de disponibilidad         |
| **Duration** (Duración) | Distribución del tiempo de respuesta de las requests (latencia, percentiles p50/p95/p99) | Detectar lentitud, cumplir SLAs de latencia, encontrar cuellos de botella |

Juntas, las métricas RED responden la pregunta fundamental: "¿Está el servicio funcionando bien para sus usuarios?" Son especialmente útiles en microservicios porque aplican uniformemente a cualquier servicio sin importar su implementación interna.

---

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directamente a Prometheus?

OTLP (OpenTelemetry Protocol) es el protocolo de transporte estándar de OpenTelemetry. Transmite datos de telemetría (trazas, métricas y logs) usando gRPC o HTTP/JSON entre la aplicación instrumentada y un backend o collector.

**Ventajas de OTLP frente a exportar directamente a Prometheus:**

| Aspecto                      | Exportar directo a Prometheus      | Usar OTLP                                              |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------ |
| **Tipos de datos**           | Solo métricas                      | Trazas + Métricas + Logs                               |
| **Modelo**                   | Pull (Prometheus hace scraping)    | Push (la app envía datos)                              |
| **Flexibilidad de backend**  | Solo Prometheus/compatible         | Cualquier backend (Jaeger, Tempo, Loki, Datadog, etc.) |
| **Intermediario**            | Ninguno necesario                  | OTel Collector (pipeline central)                      |
| **Cambio de backend**        | Requiere re-instrumentar el código | Solo se reconfigura el Collector                       |
| **Enriquecimiento de datos** | Limitado                           | El Collector puede filtrar, transformar y enrutar      |

La gran ventaja de OTLP es el desacoplamiento: la aplicación habla un único protocolo estándar con el OTel Collector, y este se encarga de transformar y enrutar los datos a cualquier backend. Si mañana se quiere cambiar de Prometheus a otro sistema, no hay que tocar el código de la app.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana actúa principalmente como plataforma de visualización y consulta. El almacenamiento suele delegarse a sistemas como Prometheus, Loki, Tempo o Mimir. La relación con OpenTelemetry es la siguiente:

```
Aplicación (OTel SDK)
        │
        │  OTLP
        ▼
OTel Collector
   ┌────┴────┐
   │         │
   ▼         ▼
Prometheus  Tempo / Loki
(métricas)  (trazas/logs)
   │         │
   └────┬────┘
        │
        ▼
     Grafana
  (visualización)
```

- Los datos de métricas exportados por OTel se almacenan en Prometheus (o Mimir/Thanos para escala), y Grafana los consulta con PromQL.
- Las trazas se almacenan en Grafana Tempo y se visualizan en Grafana con el explorador de trazas.
- Los logs se almacenan en Grafana Loki y se consultan con LogQL.

Grafana unifica la visualización de los tres pilares de observabilidad en un único lugar, correlacionando métricas, trazas y logs. Por ejemplo, desde un pico en una métrica de errores se puede navegar directamente a las trazas del período afectado, y desde una traza a los logs del pod correspondiente.

Grafana también ofrece Grafana Alloy, una distribución basada en OpenTelemetry Collector que facilita la recolección, procesamiento y envío de telemetría hacia distintos backends del ecosistema Grafana.
