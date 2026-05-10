---
id: 0016
estado: Propuesto
autor: Martina García Améndola
fecha: 2026-05-01
titulo: Registro de Nuevo Préstamo de Equipo
---

# TDD-0016: Registro de Nuevo Préstamo de Equipo

## Contexto de Negocio (PRD)

### Objetivo

Permitir el registro de préstamos de equipos a los socios de categoría `Pleno` u `Honorario`, controlando que los socios de categoría `Cadete` no puedan solicitarlos y dejando registro de la fecha de devolución para un rastreo correcto de los equipos.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Registrar los préstamos de equipos únicamente a socios de categorías `Pleno` u `Honorario`.

### Criterios de Aceptación

- El sistema debe validar que el `member_id` corresponda a un socio registrado, activo y no vacío.
- El sistema debe validar que el socio no sea de categoría `Cadete`.
- El sistema debe validar que el nombre del ítem (`item_name`) no esté vacío.
- El préstamo debe quedar guardado con estado `Loaned` por defecto.
- El sistema debe validar que la fecha de devolución (`due_date`) sea estrictamente posterior a la fecha actual de creación.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `EquipmentLoan` con las siguientes propiedades y restricciones:

- `id`: UUID (PK).
- `item_name`: Cadena de texto.
- `status`: Enumeración (`Loaned`, `Returned`, `Damaged`).
- `loan_date`: Fecha de creación autogenerada.
- `due_date`: Fecha y hora de devolución.
- `member_id`: UUID (FK).

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición de creación.

- Endpoint: `POST /api/v1/equipment-loans`
- Request Body (`CreateEquipmentLoanRequest`):

```ts
{
  item_name: string;
  due_date: string;
  member_id: string;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `EquipmentLoanRepository` (Interface en el Dominio).
2. **Servicio de Dominio**: `EquipmentLoanValidator` (valida las reglas de negocio, verificando que el socio no sea de categoría `Cadete`).
3. **Caso de Uso**: `CreateEquipmentLoanUseCase` (orquesta la validación de datos y la persistencia).
4. **Adaptador de Salida**: `PostgresEquipmentLoanRepository` (Prisma).
5. **Adaptador de Entrada**: `EquipmentLoanController` (ruta HTTP).

## Casos de Borde y Errores

| Escenario                              | Resultado Esperado                                                 | Código HTTP               |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------- |
| `member_id` vacío o no encontrado      | Mensaje: "Socio no encontrado"                                     | 404 Not Found             |
| Socio de categoría `Cadete`            | Mensaje: "Los cadetes no están habilitados para solicitar préstamos" | 400 Bad Request         |
| `item_name` vacío                      | Mensaje: "El nombre del equipo es obligatorio"                     | 400 Bad Request           |
| `due_date` es una fecha en el pasado   | Mensaje: "La fecha de devolución debe ser futura"                  | 400 Bad Request           |
| Error de conexión a DB                 | Mensaje: "Error interno, reintente más tarde"                      | 500 Internal Server Error |
| Creación exitosa                       | Retorna el préstamo creado                                         | 201 Created               |

## Plan de Implementación

1. Actualizar `schema.prisma` agregando el modelo `EquipmentLoan` y generar migración.
2. Crear tipos en `@alentapp/shared`, `EquipmentLoanRepository` y `EquipmentLoanValidator`.
3. Implementar `CreateEquipmentLoanUseCase`.
4. Construir `PostgresEquipmentLoanRepository`.
5. Exponer el endpoint en `EquipmentLoanController`.