---
id: 0016
estado: Propuesto
autor: Martina García Améndola
fecha: 2026-05-01
titulo: Registro de Nuevo Préstamo de un Equipo
---

# TDD-0016: Registro de Nuevo Préstamo de un Equipo

## Contexto de Negocio (PRD)

### Objetivo

Permitir el registro de préstamos de equipos a los socios de categoria "Senior" o "Lifetime", controlando que los de categoria "Cadete" no puedan solicitar préstamos y dejando registro de la fecha de devolución, permitiendo asi un rastreo de los equipos.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Necesita registrar los préstamos de equipos a socios unicamente de categorias Senior" o "Lifetime".

### Criterios de Aceptación

- El sistema debe validar que el id del socio (`member_id`) este registrado, activo y no sea vacio.
- El sistema debe validar que el socio no sea de categoria "Cadete".
- El sistema debe validar que el nombre del item (`item_name`) no este vacío y exista.
- El prestamo debe quedar guardado con status "Loaned" por defecto.
- `real_due_date`debe inicializarce como null.


## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `EquipmentLoan` con las siguientes propiedades y restricciones:

- `id`: UUID (PK).
- `item_name`: Cadena de texto.
- `status`: Enumeración (`Loaned`, `Returned`, `Demaged`).
- `loan_date`: Fecha de creación autogenerada.
- `due_date`: Fecha y hora de devolución.
- `member_id`: UUID (FK).
- `real_due_date`: Fecha en que se devuelve el equipo asociado a un prestamo (inicialmente null).

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición de creación.

- Endpoint: `POST /api/v1/equipment-loan`
- Request Body (`CreateEquipmentLoan`):

```ts
{
  item_name: string;
  due_date: datetime;
  member_id: int;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Interfaz en el Dominio)
2. **Servicio de Dominio**: `EquipmentLoanValidator` (recupera el socio con una funcion del DB persistence adapter del socio, y verifica que no sea de categoria "Cadete").
3. **Caso de Uso**: `CreateEquipmentLoanUseCase` (orquesta validación de datos y persistencia).
4. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (Prisma).
5. **Adaptador de Entrada**: `EquipmentLoanController` (ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| `member_id` vacío o no encontrado          | Mensaje: "Socio no encontrado"   | 409 Conflict              |
| Socio de tipo "Cadete" | Mensaje: "Los cadetes no estan habilidatos a solicitar prétamos" (Regla de negocio) | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |
| `item_name` vacío o no encontrado   | Mensaje: "Equipo no encontrado"  | 409 Conflict               |
| Socio categoria "Senior"     | Crear Prestamo (Regla de negocio)  | 201 Created               |

## Plan de Implementación

1. Actualizar `schema.prisma` agregando el modelo `EquipmentLoan` y generar migración.
2. Crear `EquipmentLoanRepository` y `EquipmentLoanValidator`.
3. Implementar `CreateEquipmentLoanUseCase`.
4. Construir `PostgresEquipmentLoanRepository`.
5. Exponer endpoint en `EquipmentLoanController`.
