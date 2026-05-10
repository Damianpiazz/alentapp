---
id: 0006
estado: Propuesto
autor: Damian Piazza
fecha: 2026-05-01
titulo: Eliminación de Deportes Existentes
---

# TDD-0006: Eliminación de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administradores retirar disciplinas deportivas del sistema si el club decide dejar de impartirlas o si fueron creadas por error, manteniendo la integridad referencial con las inscripciones existentes.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Eliminar un deporte obsoleto del catálogo para que ya no aparezca en las opciones de inscripción de los socios. Requiere una alerta para evitar borrados accidentales.

### Criterios de Aceptación

- El sistema debe requerir confirmación explícita antes del borrado.
- El sistema debe validar que el deporte exista antes de intentar borrarlo.
- El sistema debe comprobar si existen inscripciones (`Enrollment`) activas para ese deporte antes de proceder con el borrado físico, previniendo errores de integridad referencial.
- Si el borrado es exitoso, la tabla de deportes debe actualizarse automáticamente mostrando su eliminación.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/sports/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `delete(id)`).
2. **Caso de Uso**: `DeleteSportUseCase` (comprueba existencia previa e inscripciones activas vía `findById` y delega la eliminación).
3. **Adaptador de Salida**: `PostgresSportRepository` (eliminación usando el método `delete` de Prisma).
4. **Adaptador de Entrada**: `SportController` (ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                                    | Resultado Esperado                                                          | Código HTTP               |
| -------------------------------------------- | --------------------------------------------------------------------------- | ------------------------- |
| Deporte inexistente                          | Mensaje: "El deporte no existe"                                             | 404 Not Found             |
| ID con formato inválido                      | Mensaje: "Identificador inválido"                                           | 400 Bad Request           |
| Deporte con socios inscriptos (`Enrollment`) | Mensaje: "No se puede eliminar el deporte porque tiene inscripciones activas" | 409 Conflict            |
| Deporte ya eliminado previamente             | Mensaje: "El deporte no existe"                                             | 404 Not Found             |
| Error de conexión a DB                       | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |
| Eliminación exitosa                          | Respuesta vacía                                                             | 204 No Content            |

## Plan de Implementación

1. Implementar el método `delete` en el `SportRepository` (dominio) y en `PostgresSportRepository` (infraestructura).
2. Crear `DeleteSportUseCase` asegurando el chequeo de inscripciones activas antes del borrado físico.
3. Exponer el endpoint `DELETE /api/v1/sports/:id` en `SportController` y registrarlo en `app.ts`.
4. Añadir el método `deleteSport` al servicio del frontend.
5. Enlazar el botón de eliminación en la vista correspondiente agregando la confirmación del navegador (`window.confirm`) antes de ejecutar la llamada.