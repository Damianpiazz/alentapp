---
id: 0017
estado: Propuesto
autor: Martina García Améndola
fecha: 2026-05-01
titulo: Actualización de Préstamos de un Equipo Existentes
---

# TDD-0017: Actualización de Préstamos de un Equipo Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir la actualización de la fecha de devolución (`due_date`) de un préstamo, afectando así a su cambio de estado (`status: Loaned, Returned, Demaged`).

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Modificar la la fecha de devolución (`due_date`) de un préstamo, sin alterar el resto de la información del mismo como la fecha de creación, el socio o equipo asociados.

### Criterios de Aceptación

- El sistema debe impedir la modificación del nombre del equipo (`item_name`), del estado (`status`), fecha de creació, (`loan_date`) ni id del miembro (`member_id`).
- El sistema solo debe permitir la edición de `due_date` o `real_due_date`.
- Si se edita `due_date` el sistema debe corroborar que si el prestamo no está en estado `Returned`, pueda cambiar de estado `Loaned` a `Demaged` (`due_date` ingesado < fecha actual) o viceversa (`due_date` ingesado > fecha actual) y cambie de `Demaged` a `Loaned`.
- Si se edita `real_due_date` el sistema debe corroborar que si el prestamo no está en estado `Returned`, pueda cambiar de estado `Loaned` a `Returned` o de `Demaged` a `Returned` (`real_due_date` ingesado <= fecha actual).
- Si se edita `real_due_date` el sistema debe corroborar que si el prestamo está en estado `Returned`, pueda cambiar a `Loaned` (`real_due_date` > fecha actual).

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se podria modificar uno o ambos de ellos.

- Endpoint: `PUT /api/v1/equipment-loan/:id`
- Request Body (`UpdateEquipmentLoanRequest`):

```ts
{
    due_date?: datetime;
    real_due_date?: datetime;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `EquipmentLoanValidator` (valida los campos y la existencia del prestamo y llama al `UpdateSportUseCase` para los cambios de estado).
3. **Caso de Uso**: `UpdateSportUseCase` (Realiza las validaciones de los cambios de estados descriptos en los criterios de aceptacion y llama al repositorio).
4. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `EquipmentLoanController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                      | Código HTTP               |
| -------------------------------- | ------------------------------------------------------- | ------------------------- |
| Intento de cambiar el `status`     | Mensaje: "El esatdo es inmutable" o se ignora silenciosamente | 400 Bad Request     |
| Prestamo inexistente              | Mensaje: "El prestamo solicitado no existe"              | 404 Not Found             |
| Error de conexión a DB           | Mensaje: "Error interno, reintente más tarde"           | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `UpdateEquipmentLoanRequest` en `@alentapp/shared` excluyendo explícitamente el campo `name`.
2. Ampliar el `EquipmentLoanRepository` (dominio) y `PostgresEquipmentLoanRepository` (infraestructura) con el método `update`.
3. Desarrollar `UpdateEquipmentLoanUseCase` aplicando las reglas de cambio de estado descriptas en los criterios de aceptación.
4. Configurar la ruta `PUT /api/v1/equipment-loan/:id` en `EquipmentLoanController` y registrarla en `app.ts`.
5. Consumir el endpoint desde el Frontend reutilizando el modal de creación para permitir la edición.
