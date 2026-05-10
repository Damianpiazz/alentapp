---
id: 0013
estado: Propuesto
autor: Manuela Chanquía
fecha: 2026-05-01
titulo: Alta de Pago
---

# TDD-0013: Alta de Pago

## Contexto de Negocio (PRD)

### Objetivo

Registrar una nueva obligación financiera que un socio tiene con el club para gestionar la facturación y mantener el control económico.

### User Persona

- Nombre: Alberto (Administrativo / Tesorero).
- Necesidad: Cargar de forma manual las nuevas cuotas a cobrar a los socios.

### Criterios de Aceptación

- El sistema debe validar que el socio exista antes de poder asignarle el pago.
- Al finalizar, el sistema debe mostrar un mensaje de éxito.
- El pago debe quedar guardado con estado `Pending` por defecto.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Payment` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `amount`: Número decimal (float).
- `month`: Número entero del 1 al 12.
- `year`: Número entero de 4 dígitos.
- `status`: Enumeración (`Pending`, `Paid`, `Overdue`, `Canceled`) con valor por defecto `Pending`.
- `due_date`: Fecha de vencimiento (datetime).
- `payment_date`: Fecha en la que se efectúa el cobro (datetime, nullable).
- `member_id`: Identificador único universal (UUID) que actúa como clave foránea hacia el socio.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/payments`
- Request Body (`CreatePaymentRequest`):

```ts
{
  amount: number;
  month: number;
  year: number;
  due_date: string;
  member_id: string;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (Interface en el Dominio).
2. **Caso de Uso**: `CreatePaymentUseCase` (verifica que el socio exista y asigna el estado `Pending` antes de llamar al repositorio).
3. **Adaptador de Salida**: `PostgresPaymentRepository` (implementación real en BD usando Prisma).
4. **Adaptador de Entrada**: `PaymentController` (ruta HTTP).

## Casos de Borde y Errores

| Escenario                      | Resultado Esperado                            | Código HTTP               |
| ------------------------------ | --------------------------------------------- | ------------------------- |
| El socio `member_id` no existe | Mensaje: "Socio no encontrado"                | 404 Not Found             |
| Faltan datos obligatorios      | Mensaje indicando los campos faltantes        | 400 Bad Request           |
| Error de conexión a DB         | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia para `Payment` y correr migración.
2. Crear tipos en `@alentapp/shared` y puerto en el Dominio.
3. Implementar `PostgresPaymentRepository` y `CreatePaymentUseCase`.
4. Crear la ruta HTTP `POST /api/v1/payments` en `PaymentController` y conectar con el frontend.