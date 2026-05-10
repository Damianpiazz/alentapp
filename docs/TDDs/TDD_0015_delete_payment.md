---
id: 0015
estado: Propuesto
autor: Manuela Chanquía
fecha: 2026-05-03
titulo: Anulación de Pagos (Delete Lógico)
---

# TDD-0015: Anulación de Pagos (Delete Lógico)

## Contexto de Negocio (PRD)

### Objetivo

Dar de baja una obligación financiera generada por error, garantizando que el registro original no se elimine de la base de datos para mantener el historial de auditoría.

### User Persona

- Nombre: Alberto (Administrativo / Tesorero).
- Necesidad: Anular cuotas mal generadas desde la interfaz de forma segura.

### Criterios de Aceptación

- La baja lógica debe hacerse mediante el campo adicional deleted_at, asignándole la fecha y hora actual.
- El sistema no debe permitir el borrado físico del registro bajo ninguna circunstancia.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

A fines prácticos y respetando las convenciones REST para borrados lógicos, la operación de anulación se realizará modificando el estado del recurso.

- Endpoint: `DELETE /api/v1/payments/:id`
- Request Body: `None`

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (por cuestión semántica, implementará el método `delete(id)`).
2. **Servicio de Dominio**: `PaymentValidator` (encargado de verificar que el pago no esté en estado `Paid` previamente para evitar conflictos).
3. **Caso de Uso**: `DeletePaymentUseCase` (orquesta la validación utilizando el `PaymentValidator` y llama al repositorio).
4. **Adaptador de Salida**: `PostgresPaymentRepository` (el método `delete` del repositorio ejecutará en realidad un `update` de Prisma para setear el campo `deleted_at` con la fecha actual).
5. **Adaptador de Entrada**: `PaymentController` (ruta HTTP `DELETE` que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                              | Código HTTP            |
| -------------------------------- | --------------------------------------------------------------- | ---------------------- |
| El pago con el `id` no existe    | Mensaje: "El pago no existe"                                    | 404 Not Found          |
| El pago ya está `Paid`           | Mensaje: "No se puede anular un pago ya procesado"              | 409 Conflict           |
| Petición usando método `DELETE`  | Mensaje: "Operación no permitida. Use el endpoint de anulación" | 405 Method Not Allowed |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` si fuera necesario.
2. Ampliar el `PaymentRepository` con el método semántico `delete`.
3. Implementar la lógica en `DeletePaymentUseCase` utilizando el `PaymentValidator` centralizado.
4. Crear la ruta `PATCH /api/v1/payments/:id/cancel` en `PaymentController`.
5. Consumir el endpoint desde el frontend y agregar un botón de anulación en la tabla de pagos.