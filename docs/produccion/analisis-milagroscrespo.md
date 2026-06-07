# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

| Problema                                                                  | ¿Dónde ocurre?                                                  | Impacto   | Solución propuesta                                                                                                |
| :------------------------------------------------------------------------ | :-------------------------------------------------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------- |
| **Problema 1: Credenciales de la base de datos expuestas en texto plano** | `docker-compose.yml` (servicios `db` y `api`)                   | **Alto**  | Sacar las contraseñas del archivo y guardarlas en un archivo oculto `.env` que no se suba a GitHub.               |
| **Problema 2: El contenedor de la API corre como usuario Root**           | `packages/api/Dockerfile` y `packages/web/Dockerfile`           | **Alto**  | Configurar un usuario normal sin permisos de administrador usando la directiva `USER` antes de arrancar la app.   |
| **Problema 3: Falta un Healthcheck para saber si la API se congeló**      | `docker-compose.yml` (servicio `api`)                           | **Medio** | Agregar una prueba automática de salud con `healthcheck` para que Docker vigile si la API sigue respondiendo.     |
| **Problema 4: Uso de versiones de Node fijas sin actualizar (Tag fijo)**  | `packages/api/Dockerfile` y `packages/web/Dockerfile` (línea 1) | **Bajo**  | Usar versiones específicas y exactas (ej. `node:20.11-alpine`) para evitar que parches automáticos rompan la app. |
| **Problema 5: Exposición innecesaria de puertos internos al exterior**    | `docker-compose.yml` (servicio `db`, puerto `5432`)             | **Alto**  | Borrar la sección `ports` de la base de datos para que solo la API hable con ella por la red interna de Docker.   |

---

## Detalle de cada problema

#### Problema 1: Credenciales de la base de datos expuestas en texto plano

```yaml
# En docker-compose.yml
environment:
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: password123 #cualquiera que mire el codigo ve la contraseña
    POSTGRES_DB: alentapp_db

# Solución en docker-compose.yml
environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} # ahora se lee la clave en secreto desde el archivo .env

```

### Problema 2: El contenedor de la API corre como usuario Root

```yaml
# En packages/api/Dockerfile (al no declarar un usuario corre como root)
FROM node:20-alpine
WORKDIR /app
COPY . .
CMD ["npm", "run", "dev", "-w", "packages/api"]

# Solución en packages/api/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
USER node # cambia al usuario sin privilegios que ya trae la imagen de node
CMD ["npm", "run", "dev", "-w", "packages/api"]
```

### Problema 3: Falta un Healthcheck para saber si la API se congeló

```yaml
# En docker-compose.yml
api:
    build: .
    container_name: alentapp-api
    ports:
        - '3000:3000' # la API corre pero docker no monitorea si internamente se tilda

# Solución en docker-compose.yml
api:
    build: .
    container_name: alentapp-api
    ports:
        - '3000:3000'
    healthcheck:
        test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
        interval: 30s
        timeout: 10s
        retries: 3
```

### Problema 4: Uso de versiones de Node fijas sin actualizar

```yaml
Dockerfile
# En packages/api/Dockerfile y packages/web/Dockerfile
FROM node:20-alpine # puede descargar subversiones distintas y romper la app en otra PC

# Solución en packages/api/Dockerfile y packages/web/Dockerfile
FROM node:20.11.0-alpine # versión exacta y fija garantizada para todo el equipo
```

### Problema 5: Exposición innecesaria de puertos internos al exterior

```yaml
# En docker-compose.yml
db:
    image: postgres:16-alpine
    ports:
        - '5432:5432' # expone la base de datos a ataques externos de todo internet

# Solución en docker-compose.yml
db:
    image: postgres:16-alpine
    # se elimina por completo la sección ports para dejar el acceso solo por la red interna
```

## 1.2. Investigar OpenTelemetry

### • ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

- **OpenTelemetry (OTel):** Es un estándar abierto y un framework de observabilidad de la CNCF que provee APIs, librerías y SDKs para **instrumentar, generar y recolectar** telemetría (métricas, logs y trazas) desde las aplicaciones de manera unificada. Cabe destacar que OTel **no almacena ni visualiza los datos**.
- **Prometheus:** Es una herramienta de monitoreo y una **base de datos de series temporales** orientada a métricas que funciona bajo un modelo de recolección por extracción (_pulling/scraping_).
- **Diferencia clave:** OpenTelemetry se encarga del código interno de la aplicación para extraer y estandarizar la información, mientras que Prometheus es el sistema que se conecta para absorber esos datos, indexarlos y guardarlos en disco para su posterior análisis.

### • ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares fundamentales son:

1. **Métricas:** Datos numéricos agregados que muestran el comportamiento e indicadores de salud del sistema a lo largo del tiempo (ej. porcentaje de uso de CPU, cantidad de solicitudes).
2. **Logs:** Registros de texto individuales, estructurados o no, de eventos específicos con marcas de tiempo (ej. mensajes de error en consola, auditorías de acceso).
3. **Traces (Trazas):** El registro detallado del ciclo de vida y recorrido de una petición a lo largo de los distintos servicios o componentes de la arquitectura informática.

### • Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?

El método RED se enfoca específicamente en evaluar la calidad de los servicios web y arquitecturas de microservicios desde la perspectiva de la experiencia del usuario y la carga de trabajo:

- **Rate (Tasa):** Mide la cantidad de peticiones HTTP recibidas por unidad de tiempo (solicitudes por segundo). Sirve para dimensionar el **volumen de tráfico** y la demanda real que procesa la aplicación.
- **Errors (Errores):** Mide la cantidad de peticiones recibidas que fallan, comúnmente contabilizando códigos de respuesta HTTP `4xx` y `5xx`. Sirve para alertar inmediatamente si hay **degradación del servicio** o si un nuevo despliegue introdujo fallas.
- **Duration (Duración / Latencia):** Mide el tiempo que tardan las solicitudes en procesarse por completo. No se analiza mediante promedios simples para evitar sesgos, sino a través de histogramas de frecuencias. Sirve para monitorear la **performance percibida por los usuarios** y detectar cuellos de botella en endpoints críticos mediante percentiles (`p95` o `p99`).

### • ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

- **OTLP:** Es el protocolo de red nativo de OpenTelemetry, diseñado para la transmisión eficiente, segura y estandarizada de datos de telemetría a través de gRPC o HTTP (JSON/Protobuf).
- **Ventaja clave:** Su principal beneficio es que vuelve a la aplicación **independiente del proveedor** (_vendor-agnostic_). Si se exporta directamente en formato nativo de Prometheus y el día de mañana se requiere migrar a otra solución del mercado (como Datadog, Dynatrace o New Relic), habría que modificar e instrumentar nuevamente el código fuente de la app. Utilizando OTLP, el software emite datos estandarizados a un componente intermedio (como el _OTel Collector_) que se encarga de traducirlos y redirigirlos sin necesidad de alterar una sola línea de código en producción.

### • ¿Cómo se relaciona OpenTelemetry con Grafana?

- La relación conforma la tubería (_pipeline_) completa de procesamiento y visualización de la información operativa:
    1. **OpenTelemetry** instrumenta e inicializa la captura de las métricas RED y del proceso dentro del entorno de ejecución de Node.js.
    2. Esas métricas se exponen formalmente para ser recolectadas de manera cronológica por la base de datos de **Prometheus**.
    3. **Grafana** se conecta a Prometheus estableciéndolo como origen de datos (_Datasource_), ejecuta consultas con el lenguaje PromQL y renderiza los paneles visuales interactivos en tiempo real dentro del dashboard centralizado.
