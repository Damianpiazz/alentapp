---
id: 0009
estado: Propuesto
autor: Milagros Crespo
fecha: 2026-05-02
titulo: Liberación de Lockers
---

# TDD-0009: Liberación de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos finalizar el alquiler de un locker, liberándolo para que pueda ser asignado nuevamente a otro socio dentro del sistema.

### User Persona

- Nombre: Alberto (Tesorero / Coordinador Deportivo).
- Necesidad: Liberar rápidamente lockers cuyos contratos hayan finalizado o hayan sido cancelados, asegurando que vuelvan a estar disponibles para nuevos socios.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita antes de liberar el locker.
- El sistema debe validar que el locker exista antes de procesar la baja.
- La baja no debe eliminar físicamente el locker de la base de datos.
- El sistema debe cambiar el estado del locker a `Disponible`.
- El sistema debe desvincular el socio asociado al locker.
- Si la operación es exitosa, la tabla debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación que solo requiere el identificador del locker, no se enviará cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/lockers/:id`
- Request Body: `None`
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `LockerRepository` (Método `release(id)`).
2. **Caso de Uso**: `ReleaseLockerUseCase` (verifica existencia y libera el locker actualizando su estado).
3. **Adaptador de Salida**: `PostgresLockerRepository` (actualización usando Prisma para cambiar el estado a `Disponible`).
4. **Adaptador de Entrada**: `LockerController` (ruta HTTP que extrae el `id` y devuelve status `204`).

## Casos de Borde y Errores

| Escenario              | Resultado Esperado                              | Código HTTP               |
| ---------------------- | ----------------------------------------------- | ------------------------- |
| Locker inexistente     | Mensaje: "El locker no existe"                  | 404 Not Found             |
| Locker ya disponible   | Mensaje: "El locker ya se encuentra disponible" | 409 Conflict              |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde"   | 500 Internal Server Error |
| Liberación exitosa     | Respuesta vacía                                 | 204 No Content            |

## Plan de Implementación

1. Ampliar `LockerRepository` y `PostgresLockerRepository` con el método `release`.
2. Crear la lógica de negocio en `ReleaseLockerUseCase`.
3. Crear el endpoint `DELETE /api/v1/lockers/:id` en `LockerController` y registrarlo en `app.ts`.
4. Actualizar el estado del locker a `Disponible` y eliminar la relación con el socio.
5. Conectar la acción de liberación desde el frontend agregando confirmación previa (`window.confirm`).