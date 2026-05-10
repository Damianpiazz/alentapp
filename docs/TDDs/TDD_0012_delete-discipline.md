---
id: 0012
estado: Propuesto
autor: Lucia Meza
fecha: 2026-04-30
titulo: Eliminación de Sanción Disciplinaria
---

# TDD-0012: Eliminación de Sanción Disciplinaria

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo elimine una sanción disciplinaria registrada en el sistema, en caso de error de carga o invalidación de la sanción.

### User Persona

- Nombre: Alberto (Administrativo).
- Necesidad: Eliminar una sanción incorrectamente registrada o que no debería haberse aplicado, de forma rápida desde el panel de administración. Necesita una advertencia antes de borrar para no cometer equivocaciones irreparables.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado.
- El sistema debe validar que la sanción exista antes de intentar borrarla.
- El sistema debe realizar un borrado físico de la base de datos (hard delete).
- Si el borrado es exitoso, la tabla debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/disciplines/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `DisciplineRepository` (Método `delete(id)`).
2. **Caso de Uso**: `DeleteDisciplineUseCase` (comprueba existencia previa vía `findById` y delega la eliminación).
3. **Adaptador de Salida**: `PostgresDisciplineRepository` (eliminación usando el método `delete` de Prisma).
4. **Adaptador de Entrada**: `DisciplineController` (ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario              | Resultado Esperado                            | Código HTTP               |
| ---------------------- | --------------------------------------------- | ------------------------- |
| ID inexistente         | Mensaje: "Sanción no encontrada"              | 404 Not Found             |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |
| Eliminación exitosa    | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Ampliar el `DisciplineRepository` y `PostgresDisciplineRepository` con el método `delete`.
2. Crear la lógica de negocio en `DeleteDisciplineUseCase`.
3. Crear el endpoint `DELETE /api/v1/disciplines/:id` en `DisciplineController` y registrarlo en `app.ts`.
4. Añadir el método `deleteDiscipline` al servicio del frontend (`disciplines.ts`).
5. Enlazar el botón de eliminación en la vista correspondiente agregando la confirmación del navegador (`window.confirm`) antes de hacer la llamada.