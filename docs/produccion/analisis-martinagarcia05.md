# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

| Problema                            | ¿Dónde ocurre?             | Impacto                                                                                                               | Solucion implementada                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No existen networks                 | docker-compose.yml         | Alto: puertos de la bd se exponen directamente al entorno host                                                        | agregar redes privadas virtuales                                                                                                                                   |
| No hay directiva `deploy.resources` | docker-compose.yml         | Medio: no se limita el uso de CPU o memoria en los contenedores                                                       | configurar parámetros de limits y reservations en los servicios                                                                                                    |
| contenedor se ejecuta como `root`   | Dockerfile de web y api    | Alto: por seguridad, cualquier proceso/usuario debe tener los permisos estrictamente necesarios para hacer su trabajo | crear usuario con privilegios y permisos al filesystem                                                                                                             |
| diseñado para el desarrollo local   | packages/api/Dockerfile:22 | Alto: imposibilita el despliegue a produccion                                                                         | implementar un multi-stage build que compile el código TypeScript a JavaScript puro y descarte las dependencias de desarrollo (devDependencies) en la imagen final |
| diseñado para el desarrollo local   | packages/web/Dockerfile:16 | Alto: imposibilita el despliegue a produccion                                                                         | agregar etapa de npm run build para generar los assets estáticos minificados listos para producción                                                                |

## 1.2. Investigar OpenTelemetry

- ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
  Open Telemetry es un framework de código abierto neutral para proveedores de Observabilidad, diseñado para instrumentar, generar, recopilar y exportar datos de telemetría como trazas, métricas y logs.
  OpenTelemetry es un estándar abierto neutral respecto al proveedor.
  Prometheus es un elemento fundamental del paisaje de observabilidad, ampliamente utilizado para la monitorización y alertas dentro de las organizaciones.

- ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
  Los 3 pilares de la observabilidad son trazas, métricas y logs; la forma en que pueden venir los datos.
  Open Telemetry aborda todos.

- Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?
  Es un framework de metricas para el software, se enfoca en el estado del servicio.
  Rate (número de request por segundo), Errors (número de las cuales están fallando) y Duration (cantidad de tiempo que les lleva)

- ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente
  a Prometheus?
  OTLP es un protocolo de entrega de datos de telemetría de propósito general diseñado dentro del ámbito del proyecto OpenTelemetry. OTLP es un protocolo de tipo solicitud/respuesta: los clientes envían solicitudes, y el El servidor responde con las respuestas correspondientes.
  Las ventajas de OTLP ante Prometheus son:
    - Estándar unificado y multi‑backend
    - Mismo protocolo para todos los tipos de señal
    - Compatibilidad directa con Prometheus moderno
    - Mejor soporte de características modernas
    - Menos acoplamiento a formato Prometheus
- ¿Cómo se relaciona OpenTelemetry con Grafana?
  OpenTelemetry ofrece herramientas de código abierto, SDKs y estándares neutrales respecto al proveedor para la observabilidad de aplicaciones. Esto es una combinación perfecta para la estrategia de "gran tienda" de la plataforma de observabilidad Grafana, que permite la interoperabilidad y la elección. La capacidad de reunir la telemetría de infraestructura y plataforma, como las métricas Prometheus de Kubernetes y la telemetría de aplicaciones, en un backend unificado de monitorización de código abierto y unificado sirve de puente entre operaciones y desarrolladores de aplicaciones, y ofrece nuevas formas de colaboración e insights.
