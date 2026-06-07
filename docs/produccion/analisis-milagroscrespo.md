# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

| Problema                                                                       | ¿Dónde ocurre?                                                                             | Impacto   | Solución propuesta                                                                                                                                                                                                                                                                 |
| :----------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Credenciales sensibles hardcodeadas en texto plano**                         | `docker-compose.yml` (líneas de entorno en servicios `db` y `api`)                         | **Alto**  | Remover las variables `POSTGRES_PASSWORD` y `DATABASE_URL` del archivo de configuración y utilizar un archivo `.env` externo mapeado mediante la directiva `env_file` o Docker Secrets.                                                                                            |
| **Ausencia de políticas de reinicio automático (`restart`)**                   | `docker-compose.yml` (servicios `db`, `api` y `web`)                                       | **Alto**  | Agregar la directiva `restart: unless-stopped` a todos los servicios en el archivo de producción para garantizar que si un proceso falla o el servidor físico se reinicia, los contenedores vuelvan a levantarse automáticamente.                                                  |
| **Instalación de dependencias de desarrollo en la imagen final**               | `packages/api/Dockerfile` y `packages/web/Dockerfile` (líneas `RUN npm install`)           | **Alto**  | Implementar un _multi-stage build_. Utilizar una primera etapa para instalar todas las dependencias y compilar TypeScript/Vite, y una etapa final limpia que solo conserve los artefactos necesarios. Para la API, instalar dependencias de producción usando `npm ci --omit=dev`. |
| **Ejecución de procesos como usuario Root por defecto**                        | `packages/api/Dockerfile` y `packages/web/Dockerfile` (al no declarar la directiva `USER`) | **Alto**  | Forzar el uso de un usuario del sistema con privilegios reducidos antes del comando de ejecución final mediante la instrucción `USER node` (aprovechando que las imágenes Alpine de Node ya lo traen configurado por defecto).                                                     |
| **Bindeo de volúmenes de desarrollo y comandos _watch_ o _dev_ en producción** | `docker-compose.yml` (secciones `volumes: - .:/app` y bloques `command`)                   | **Medio** | Remover los montajes de volúmenes locales en el entorno de producción. Las imágenes productivas deben ser inmutables, embebiendo el código ya compilado mediante la instrucción COPY y ejecutando los procesos en modo nativo sin observar cambios (watch)                         |

### Descripción detallada de los problemas identificados

- **Credenciales hardcodeadas:** En producción, si las contraseñas quedan expuestas en texto plano dentro de los archivos de configuración que se suben al repositorio, cualquier usuario con acceso al código (o al historial de Git) puede comprometer las bases de datos. Siguiendo las buenas prácticas del desarrollo moderno, el entorno debe ser agnóstico y recibir los secretos de forma externa en tiempo de ejecución.
- **Ausencia de políticas de reinicio automático:** Actualmente, si la base de datos o la API sufren un error crítico inesperado que detiene el proceso de Node/Postgres, el contenedor se quedará en estado _Exited_ de forma permanente, dejando la aplicación caída hasta que un administrador entre manualmente a la consola a reiniciarla. En entornos productivos, el sistema debe ser auto-recuperable.
- **Dependencias de desarrollo en producción:** Herramientas de compilación o ejecutables de pruebas solo se usan para escribir y validar código. Si se mantienen en la ejecución productiva, se incrementa innecesariamente el tamaño de la imagen y se regalan herramientas que un atacante podría aprovechar para compilar scripts maliciosos si logra vulnerar el contenedor.
- **Ejecución como Root:** Por defecto, si no se especifica un usuario limitado, los procesos de Node de los contenedores se ejecutan con máximos privilegios de sistema. Si la aplicación sufre una vulnerabilidad de ejecución remota de código (RCE), un atacante tomará el control total del contenedor y facilitará un posible escape hacia el servidor físico que lo aloja.
- **Volúmenes locales y comandos de desarrollo:** Mapear el directorio raíz (`.:/app`) y usar herramientas como `tsx watch` o `vite` en producción anula la inmutabilidad de los contenedores y degrada gravemente el rendimiento del sistema debido a la sincronización constante de archivos con el host, sumado al consumo innecesario de recursos del modo observación.

---

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
