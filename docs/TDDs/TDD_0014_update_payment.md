---
id: 0014
estado: Propuesto
autor: Manuela Chanquía
fecha: 2026-05-01
titulo: Actualizacion de pagos existentes.
---

# TDD-0014: Actualizacion de pagos existentes.

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos actualizar la información de una obligación financiera existente en el sistema, específicamente para registrar el cobro de la misma y cambiar su estado para mantener las finanzas del club al día.

### User Persona
*   **Nombre**: Administrativo / Tesorero
*   **Necesidad**: Modificar el estado de los pagos rápidamente desde la tabla del panel de administración cuando un socio abona su cuota, asegurándose de no procesar el mismo cobro dos veces por error.

### Criterios de Aceptación
*   El sistema debe permitir actualizar el estado del pago y su fecha de cobro.
*   El sistema debe validar que el pago a actualizar se encuentre previamente en estado "Pendiente" para garantizar la idempotencia.
*   Si el pago ya fue cobrado o anulado, la operación debe ser rechazada.
*   Si la edición es correcta, debe retornar los nuevos datos del pago actualizados, forzando la `fecha_pago` con la fecha y hora del sistema.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial (PATCH a nivel de negocio, aunque el endpoint implemente PUT).

*   **Endpoint**: `PUT /api/v1/payments/:id`
*   **Request Body** (UpdatePaymentRequest):
```ts
{
    amount?: float;
    status?: 'Pending' | 'Paid' | 'Overdue' | 'Canceled';
    payment_date?: datetime;
}
```
<!-- Se definio que estos serán los unicos atributos modificables -->

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `PaymentValidator` (Encargado de verificar la idempotencia revisando que el pago no esté en estado `Paid` o `Canceled` antes de permitir el cambio).
3. **Caso de Uso**: `UpdatePaymentUseCase` (Orquesta la validación, asigna la `payment_date` actual y llama al repositorio).
4. **Adaptador de Salida**: `PostgresPaymentRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `PaymentController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                                   | Código HTTP               |
| ----------------------------| ---------------------------------------------        | ------------------------- |
| Pago inexistente            | Mensaje: "El pago no existe"                         | 400 Bad Request           |
| El pago ya está "Paid"      | Mensaje: "El pago ya se encuentra procesado"         | 409 Conflict              |
| El pago está "Canceled"     | Mensaje: "No se puede cobrar un pago que fue anulado"| 409 Conflict              |
| Error de conexión a DB      | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdatePaymentRequest`).
2. Ampliar el `PaymentRepository` con el método `update`.
3. Implementar la lógica en `UpdatePaymentUseCase` utilizando el `PaymentValidator` centralizado.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el vista para regstrar pago.