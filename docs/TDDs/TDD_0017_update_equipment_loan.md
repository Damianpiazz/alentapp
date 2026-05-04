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

Registrar el estado en que se encuentra el equipo a la hora de la devolución, si está bien: `Returned` y si esta dañado: `Demaged`.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Registrar una devolución de un préstamo y el estado del equipo prestado.

### Criterios de Aceptación

- El sistema debe impedir la modificación del nombre del equipo (`item_name`), fecha de creació, (`loan_date`) ni id del miembro (`member_id`),fecha de devolución esperada (`due_date`).
- Si el equipo está bien, se actualiza el `status` a `Returned` y si esta dañado a `Demaged`.
- El prestamo debe estar inicialment en estado `Loaned`.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son obligatorios.

- Endpoint: `PUT /api/v1/equipment-loan/:id`
- Request Body (`UpdateEquipmentLoanRequest`):

```ts
{
    status: `Returned` | `Demaged`;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `EquipmentLoanValidator` (valida que se ingrese únicamente en status: `Returned` o `Demaged` y que previamente este en estado `Loaned`).
3. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (Actualización usando el método `update` de Prisma).
4. **Adaptador de Entrada**: `EquipmentLoanController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                      | Código HTTP               |
| -------------------------------- | ------------------------------------------------------- | ------------------------- |
| Intento de cambiar el `loan_date`     | Mensaje: "El estado es inmutable" o se ignora silenciosamente | 400 Bad Request     |
| Prestamo inexistente              | Mensaje: "El prestamo solicitado no existe"              | 404 Not Found             |
| Error de conexión a DB           | Mensaje: "Error interno, reintente más tarde"           | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `UpdateEquipmentLoanRequest` en `@alentapp/shared` excluyendo explícitamente el campo `name`.
2. Ampliar el `EquipmentLoanRepository` (dominio) y `PostgresEquipmentLoanRepository` (infraestructura) con el método `update`.
3. Desarrollar `EquipmentLoanValidator` aplicando las validaciones correspondientes.
4. Configurar la ruta `PUT /api/v1/equipment-loan/:id` en `EquipmentLoanController` y registrarla en `app.ts`.
5. Consumir el endpoint desde el Frontend reutilizando el modal de creación para permitir la edición.
