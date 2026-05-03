---
id: 0013
estado: Propuesto
autor: Manuela Chanquía
fecha: 2026-05-01
titulo: Alta de pago
---

# TDD-0013: Alta de pago

## Contexto de Negocio (PRD)

### Objetivo
Registrar una nueva obligación financiera que un socio tiene con el club para gestionar la facturación y mantener el control económico.

### User Persona
*   **Nombre**: Administrativo / Tesorero
*   **Necesidad**: Cargar de forma manual las nuevas cuotas a cobrar a los socios.

### Criterios de Aceptación
*   El sistema debe validar que el socio exista antes de poder asignarle el pago.
*   Al finalizar, el sistema debe mostrar un mensaje de éxito.
*   El pago debe quedar guardado con estado "Pendiente" por defecto.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Payment` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `amount`: Numero decimal (float).
- `month`: Numero entero del 1 al 12.
- `year`: Numero entero de 4 dígitos.
- `status`: Enumeración (`Pending`, `Paid`, `Overdue`, `Canceled`) con valor por defecto `Pending`.
- `due_date`: Fecha de vencimiento (datetime).
- `payment_date`: Fecha en la que se efectúa el cobro (datetime, nullable).
- `member_id`: Identificador único universal (UUID) que actúa como clave foránea hacia el socio.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

*   **Endpoint**: `POST /api/v1/payments`
*   **Request Body** (CreatePaymentRequest):
```ts
{
    amount: float;
    month: int;
    year: int;
    status: 'Pending' | 'Paid' | 'Overdue' | 'Canceled';
    due_date: datetime;
    member_id: uuid;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: PaymentRepository (Interface en el Dominio).
2. Caso de Uso: CreatePayment (Lógica que verifica si el socio existe y asigna el estado `Pendiente` antes de llamar al repositorio).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD usando Prisma).
4. Adaptador de Entrada: PaymentController (Ruta HTTP).

## Casos de Borde y Errores
| Escenario                         | Resultado Esperado                            | Código HTTP               |
| ----------------------------      | --------------------------------------------- | ------------------------- |
| El socio `member_id` no existe    | Mensaje: "Socio no encontrado"                | 404 Not Found             |
| Faltan datos obligatorios         | Mensaje indicando los campos faltantes        | 400 Bad Request           |
| Error de conexión a DB            | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación
1. Definir esquema de persistencia para Payment y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso.
4. Crear la ruta HTTP en el backend y conectar con el frontend.