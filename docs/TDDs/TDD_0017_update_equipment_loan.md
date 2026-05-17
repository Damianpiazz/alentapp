---
id: 0017
estado: Propuesto
autor: Martina García Améndola
fecha: 2026-05-01
titulo: Actualización de Préstamos de Equipo Existentes
---

# TDD-0017: Actualización de Préstamos de Equipo Existentes

## Contexto de Negocio (PRD)

### Objetivo

Registrar el estado en que se devuelve el equipo: `Returned` si está en buen estado, o `Damaged` si presenta daños.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Registrar la devolución de un préstamo y el estado del equipo prestado.

### Criterios de Aceptación

- El sistema debe impedir la modificación de `item_name`, `loan_date`, `member_id` y `due_date`.
- El sistema debe actualizar el `status` a `Returned` si el equipo está en buen estado, o a `Damaged` si presenta daños.
- El préstamo debe encontrarse inicialmente en estado `Loaned` para poder ser actualizado.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. El campo `status` es obligatorio.

- Endpoint: `PUT /api/v1/equipment-loans/:id`
- Request Body (`UpdateEquipmentLoanRequest`):

```ts
{
  status: 'Returned' | 'Damaged';
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `EquipmentLoanValidator` (valida que el `status` sea `Returned` o `Damaged` y que el préstamo esté previamente en estado `Loaned`).
3. **Caso de Uso**: `UpdateEquipmentLoanUseCase` (orquesta la validación y llama al repositorio).
4. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `EquipmentLoanController` (ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                                 | Resultado Esperado                                                    | Código HTTP               |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------- |
| Intento de modificar campos inmutables    | Mensaje: "El campo no puede ser modificado" o se ignora silenciosamente | 400 Bad Request         |
| Préstamo inexistente                      | Mensaje: "El préstamo solicitado no existe"                           | 404 Not Found             |
| Préstamo no está en estado `Loaned`       | Mensaje: "Solo se pueden actualizar préstamos en estado Loaned"       | 409 Conflict              |
| Error de conexión a DB                    | Mensaje: "Error interno, reintente más tarde"                         | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en `@alentapp/shared` (`UpdateEquipmentLoanRequest`).
2. Ampliar el `EquipmentLoanRepository` (dominio) y `PostgresEquipmentLoanRepository` (infraestructura) con el método `update`.
3. Implementar `UpdateEquipmentLoanUseCase` con las validaciones correspondientes mediante `EquipmentLoanValidator`.
4. Configurar la ruta `PUT /api/v1/equipment-loans/:id` en `EquipmentLoanController` y registrarla en `app.ts`.
5. Consumir el endpoint desde el frontend reutilizando el modal de creación para la edición.