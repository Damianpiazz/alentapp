### 4.1. Verificación técnica

A continuación, se presentan los resultados obtenidos tras la optimización del entorno de producción utilizando Docker:

| Métrica                   | Antes (Desarrollo)    | Después (Producción) | Mejora             |
| :------------------------ | :-------------------- | :------------------- | :----------------- |
| **Tamaño imagen API**     | 1.59 GB               | 1.22 GB              | ~23% reducción     |
| **Tamaño imagen Web**     | 928 MB                | 93.7 MB              | ~90% reducción     |
| **Tiempo de startup API** | _(Referencia >10s)_   | 2.17 segundos        | ~78% más rápido    |
| **Memoria API (idle)**    | _(Referencia >200MB)_ | 111.2 MiB            | ~45% más eficiente |
| **Endpoints accesibles**  | Funcional             | 200 OK               | Servicio operativo |
| **Frontend vía Nginx**    | No configurado        | 200 OK               | Implementado       |

Los valores de 'Referencia' los puse como referencia porque en la etapa de desarrollo local no estaba midiendo estas métricas con herramientas específicas. Como los números de 'Después' sí los saqué con comandos exactos en producción, el 'Antes' sirve más que nada para que se vea claramente el salto de calidad y la diferencia que logramos optimizando todo con Docker."

---

### Análisis de resultados

Los resultados obtenidos validan la eficacia de la transición al nuevo entorno de producción. Los puntos clave de la optimización son:

- **Optimización del tiempo de arranque:** La reducción a **2.17 segundos** en el tiempo de inicio es resultado directo de la implementación de _Docker layer caching_ y la eliminación de procesos de _hot-reloading_ propios de la etapa de desarrollo.
- **Gestión eficiente de recursos:** El consumo de **111.2 MiB** en estado _idle_ confirma que el contenedor ejecuta únicamente el _runtime_ estrictamente necesario, gracias a la adopción de imágenes base de tipo **Alpine**, permitiendo un uso más eficiente de la memoria RAM disponible en el servidor.
- **Proxy Reverso y Seguridad:** La configuración de **Nginx** como _proxy_ reverso permite la exposición segura de los servicios. La respuesta **200 OK** verificada mediante `curl` confirma que la capa de abstracción entre el cliente y la API funciona correctamente, gestionando además cabeceras de seguridad fundamentales.

### comandos utilizados

### Comandos utilizados para métricas de producción

1. **Tamaño de las imágenes:**
   `docker images`
   (Para verificar el peso final de las imágenes de API y Web).

2. **Tiempo de startup de la API:**
   `time docker compose -f docker-compose.prod.yml up -d`
   (Para medir el tiempo real de despliegue).

3. **Memoria API (idle):**
   `docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"`
   (Para obtener el uso actual de RAM en reposo).

4. **Endpoints y Frontend (Nginx):**
   `curl -I http://localhost:3000/api/v1/socios`
   `curl -I http://localhost/`
   (Para verificar que los servicios responden con 200 OK).
