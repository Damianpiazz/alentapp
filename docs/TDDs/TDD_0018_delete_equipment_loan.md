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
- La operación debe ser idempotente: si se intenta eliminar un préstamo que ya fue eliminado lógicamente de forma previa, el sistema debe responder de manera exitosa sin causar errores.

### Criterios de Aceptación

- El sistema debe requerir confirmación explícita antes del borrado.
- El sistema debe validar que el préstamo exista antes de intentar borrarlo.
- El sistema debe realizar un borrado lógico de la base de datos.
- Si el borrado es exitoso, la tabla de EquipmentLoan debe actualizarse automáticamente mostrando su eliminación.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/equipment-loan/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Método `delete(id)`).
2. **Caso de Uso**: `DeleteEquipmentLoanUseCase` (Comprueba existencia previa de préstamos activos vía `findById` y delega la eliminación).
3. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (Eliminación usando el método `delete` de Prisma).
4. **Adaptador de Entrada**: `EquipmentLoanController` (Ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP actual        |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Prestamo inexistente          | Mensaje: "El prestamo no existe"               | 404 Not Found           |
| Error de conexión a DB     | Mensaje: error del motor de base de datos     | 500 Internal Server Error           |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |
| Préstamo ya eliminado (borrado lógico previo)        | Se ignora la acción silenciosamente                               | 204 No Content            |

## Plan de Implementación

1. Implementar el método `delete` en el `EquipmentLoanRepository` (dominio) y en `PostgresEquipmentLoanRepository` (infraestructura).
2. Crear `DeleteEquipmentLoanUseCase` asegurando el chequeo de préstamos activos antes del borrado físico.
3. Exponer el endpoint `DELETE /api/v1/equipment-loan/:id` en `EquipmentLoanController` y registrarlo en `app.ts`.
4. Añadir el método `deleteEquipmentLoan` al servicio del Frontend.
5. Enlazar el botón de eliminación en la vista correspondiente agregando la confirmación del navegador (`window.confirm`) antes de ejecutar la llamada.
