---
id: 0018
estado: Propuesto
autor: Martina García Améndola
fecha: 2026-05-01
titulo: Eliminación de Préstamos de un Equipo Existentes
---

# TDD-0017: Eliminación de Préstamos de un Equipo Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administradores eliminar préstamos del sistema si fueron creadas por error.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Borrar un prestamo creado por error, con equipo o socio erróneos. Requiere una advertencia antes de borrar para asegurar que el usuario esta seguro que desea borrar el prestamo.

### Criterios de Aceptación

- El sistema debe requerir confirmación explícita antes del borrado.
- El sistema debe validar que el préstamo exista antes de intentar borrarlo.
- El sistema debe realizar un borrado lógico de la base de datos.
- Si el borrado es exitoso, la tabla de EquipmentLoad debe actualizarse automáticamente mostrando su eliminación.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/equipment-load/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoadRepository` (Método `delete(id)`).
2. **Caso de Uso**: `DeleteEquipmentLoadUseCase` (Comprueba existencia previa e inscripciones activas vía `findById` y delega la eliminación).
3. **Adaptador de Salida**: `PostgresEquipmentLoadRepository` (Eliminación usando el método `delete` de Prisma).
4. **Adaptador de Entrada**: `EquipmentLoadController` (Ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP actual        |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Prestamo inexistente          | Mensaje: "El prestamo no existe"               | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: error del motor de base de datos     | 400 Bad Request           |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Implementar el método `delete` en el `EquipmentLoadRepository` (dominio) y en `PostgresEquipmentLoadRepository` (infraestructura).
2. Crear `DeleteEquipmentLoadUseCase` asegurando el chequeo de inscripciones activas antes del borrado físico.
3. Exponer el endpoint `DELETE /api/v1/equipment-load/:id` en `EquipmentLoadController` y registrarlo en `app.ts`.
4. Añadir el método `deleteEquipmentLoad` al servicio del Frontend.
5. Enlazar el botón de eliminación en la vista correspondiente agregando la confirmación del navegador (`window.confirm`) antes de ejecutar la llamada.
