# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

| Problema                                               | ¿Dónde ocurre?                                                        | Impacto                                                                                                 |
| :----------------------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **1.** Credenciales hardcodeadas en docker-compose     | `alentapp\docker-compose.yml:6-8`                                     | Alto - cualquiera con acceso al repo tiene acceso directo a la base de datos de producción.             |
| **2.** Contenedores corren como root                   | `alentapp\packages\api\Dockerfile` `alentapp\packages\web\Dockerfile` | Alto - si la app es comprometida, el atacante tiene control total del sistema de archivos del host.     |
| **3.** Servidor de desarrollo expuesto en producción   | `alentapp\docker-compose.yml:38` `alentapp\docker-compose.yml:58`     | Alto - sin compilación ni optimización, la app es lenta, inestable y expone información de debug.       |
| **4.** Sin límites de recursos (CPU/memoria)           | `alentapp\docker-compose.yml`                                         | Medio - un leak o spike puede tumbar el host, pero requiere una condición de falla previa para ocurrir. |
| **5.** prisma migrate dev en el startup del contenedor | `alentapp\docker-compose.yml:36`                                      | Alto - puede destruir o alterar datos en producción al reiniciar el contenedor.                         |

### Detalle de cada problema

#### Problema 1:

Usuario, contraseña y URL de base de datos están en texto plano directamente en el docker-compose.yml. Cualquiera con acceso al repositorio obtiene credenciales de producción.

##### Solución propuesta:

```
## Usar archivo .env (en .gitignore) y referenciar en compose:
environment:
  POSTGRES_USER: ${DB_USER}
  POSTGRES_PASSWORD: ${DB_PASSWORD}
  POSTGRES_DB: ${DB_NAME}

## En .env.example (sí se versiona, sin valores reales):
DB_USER=
DB_PASSWORD=
DB_NAME=
```

#### Problema 2:

Ningún Dockerfile define un usuario no privilegiado. Por defecto, Node corre como root dentro del contenedor, lo que amplifica cualquier vulnerabilidad de la app.

##### Solución propuesta:

```
## Agregar antes del CMD en ambos Dockerfiles:
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser
```

#### Problema 3:

El comando de inicio usa tsx watch (hot-reload) y vite dev para la web. Estos servidores no están diseñados para producción: sin compresión, sin optimización, con overhead de recarga.

##### Solución propuesta:

```
## API: compilar TypeScript y correr con node
RUN npm run build -w packages/api
CMD ["node", "packages/api/dist/app.js"]

## Web: build estático servido por nginx
RUN npm run build -w packages/web
## Usar imagen nginx:alpine para servir dist/
```

#### Problema 4:

Ningún servicio define deploy.resources.limits. Un spike de tráfico o un leak de memoria puede consumir todos los recursos del host, afectando otros servicios del sistema.

##### Solución propuesta:

```
## Agregar en cada servicio (db, api, web):
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      memory: 256M
```

#### Problema 5:

migrate dev es un comando pensado para desarrollo: crea migraciones nuevas, puede resetear la DB y no es idempotente de forma segura. En producción se debe usar migrate deploy.

##### Solución propuesta:

```
command: >
  sh -c "npx prisma migrate deploy --config packages/api/prisma.config.ts &&
         node packages/api/dist/app.js"
```

## 1.2. Investigar OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry (OTel) es un framework y un conjunto de herramientas de observabilidad de código abierto. Está diseñado para facilitar la generación, recolección y exportación de datos de telemetría (trazas, métricas y logs) desde las aplicaciones. Su principal característica es que es neutral e independiente de proveedores y herramientas.

OpenTelemetry no es un backend de observabilidad (es decir, no almacena ni visualiza los datos). Prometheus, por el contrario, actúa como un backend de monitoreo donde puedes almacenar los datos y ejecutar consultas. En un flujo de trabajo típico, OpenTelemetry se encarga de instrumentar el código y recolectar los datos, y luego los exporta hacia Prometheus para su almacenamiento.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

En el desarrollo de software, los tres pilares de los datos de telemetría son las trazas, las métricas y los logs.

- **Trazas:** Representan el recorrido completo y el ciclo de vida de una solicitud a medida que atraviesa los distintos microservicios o componentes de un sistema distribuido.
- **Métricas:** Reflejan medidas cuantitativas y continuas sobre el estado y rendimiento del sistema.
- **Logs:** Son registros discretos de eventos, mensajes o errores generados por el software y la infraestructura.

OpenTelemetry aborda los tres pilares. El proyecto provee APIs, SDKs e instrumentaciones para generar, procesar y exportar unificadamente tanto métricas, como trazas y logs de los sistemas y aplicaciones.

### Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?

El método RED es una filosofía de monitoreo orientada específicamente a arquitecturas de microservicios, creada por Tom Wilkie. Sus tres métricas sirven para lo siguiente:

- **Rate (Tasa):** Es el número de solicitudes (requests) por segundo. Sirve para visualizar el tráfico actual y medir cuánta demanda está recibiendo tu sistema en un momento dado.
- **Errors (Errores):** Es la cantidad (o tasa) de solicitudes que están fallando, típicamente representadas por códigos HTTP 4xx o 5xx. Sirve para conocer el porcentaje exacto de errores y detectar si el servicio está rechazando usuarios.
- **Duration (Duración):** Es la cantidad de tiempo que tardan en resolverse las solicitudes, es decir, la latencia. Sirve para evaluar cuellos de botella y la performance percibida por el usuario final (si la página o API está lenta).

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

OTLP es el protocolo estándar creado por el proyecto que define la forma y estructura en la que viajan los datos de telemetría de OpenTelemetry.

Ventaja frente a la exportación directa: Al exportar usando OTLP, envías tus datos en un formato estándar y neutral que puede ser reenviado a cualquier backend compatible con OpenTelemetry. La gran ventaja es que evitas el vendor lock-in (quedar atado a un solo proveedor como Prometheus). Si el día de mañana decides cambiar tu sistema de métricas por otro comercial u open source, no tienes que cambiar el código de tu aplicación ni aprender nuevas APIs, ya que OTLP te brinda la flexibilidad para conectarte a diferentes sistemas fácilmente.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana Labs es uno de los principales contribuyentes del proyecto y su plataforma se integra profundamente con OpenTelemetry. La relación se da en varias áreas:

- **Recepción de datos:** Grafana Cloud y el stack LGTM de Grafana cuentan con soporte de primer nivel para recibir directamente métricas, logs y trazas a través de un endpoint (OTLP) de OpenTelemetry.
- **Grafana Alloy:** Grafana ofrece su propia distribución de código abierto del recolector de OpenTelemetry (OpenTelemetry Collector) llamada Grafana Alloy, que es 100% compatible con OTLP.
- **Unificación de visualización:** En la práctica (como se ve en la Actividad 4 de tu proyecto), Grafana te permite tomar los datos de telemetría exportados por OpenTelemetry (mediante Prometheus) y construir dashboards visuales (como el Dashboard RED) para analizar el rendimiento del software y cruzar datos de tu aplicación con métricas de la infraestructura
