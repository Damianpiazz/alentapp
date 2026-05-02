---
id: 0011
estado: Propuesto
autor: Lucia Meza
fecha: 2026-04-30
titulo: Actualización de Sanción Disciplinaria
---

# TDD-0011: Actualización de Sanción Disciplinaria

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un administrativo modifique los datos de una sanción disciplinaria existente (reason, período de vigencia o tipo de suspensión).

### User Personas
* **Nombre:** Administrativo
* **Necesidad:** Corregir o actualizar una sanción previamente registrada, ya sea por error de carga o cambio en la decisión disciplinaria.

### Criterios de Aceptación (User Stories)

- Como administrativo, quiero actualizar una sanción existente para corregir información o modificar su vigencia.
  - **Escenario de éxito:** Si la sanción existe y los datos son válidos, el sistema actualiza el registro y devuelve la sanción modificada.
  - **Escenario de fallo (ID inexistente):** Si el `id` no corresponde a una sanción existente, el sistema responde con error sin modificar nada.
  - **Escenario de fallo (fechas inválidas):** Si `end_date` es igual o anterior a `start_date`, el sistema debe rechazar la actualización.
  - **Escenario de fallo (body vacío):** Si no se envía ningún campo para actualizar, el sistema debe rechazar la solicitud.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se utilizará la entidad `Discipline` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `member_id`: Referencia al socio sancionado (FK hacia Member). No modificable.
- `reason`: Cadena de texto describiendo la falta cometida.
- `start_date`: Fecha de inicio de la sanción.
- `end_date`: Fecha de fin de la sanción. Debe ser estrictamente posterior a `start_date`.
- `is_total_suspension`: Booleano. Si es `true`, el socio queda bloqueado de todas las acciones.
- `createdAt`: Fecha de creación autogenerada.

```ts
export interface Discipline {
  id: string;
  member_id: string;
  reason: string;
  start_date: Date;
  end_date: Date;
  is_total_suspension: boolean;
  createdAt: Date;
}
```

### Contrato de API (Shared DTOs)

**Actualizar sanción**
- **Endpoint:** `PUT /api/v1/disciplines/:id`
- **Request Body (UpdateDisciplineRequest):**
```ts
{
  reason?: string;
  start_date?: string;   
  end_date?: string;      
  is_total_suspension?: boolean;
}
```
- **Response Body (DisciplineResponse):**
```ts
{
  id: string;
  member_id: string;
  reason: string;
  start_date: string;
  end_date: string;
  is_total_suspension: boolean;
  createdAt: string;
}
```

### Componentes de Arquitectura Hexagonal
1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: UpdateDiscipline (Valida fechas y busca la sanción antes de persistir).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Rutas HTTP).

---

## Casos de Borde y Errores

| Escenario                             | Resultado Esperado                                           | Código HTTP               |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------- |
| Body vacío                            | Mensaje: "Debe enviarse al menos un campo para actualizar"   | 400 Bad Request           |
| `end_date` igual a `start_date`    | Mensaje: "La fecha de fin debe ser posterior a la de inicio" | 400 Bad Request           |
| `end_date` anterior a `start_date` | Mensaje: "La fecha de fin debe ser posterior a la de inicio" | 400 Bad Request           |
| Formato de fecha inválido             | Mensaje: "Formato de fecha inválido, use YYYY-MM-DD"         | 400 Bad Request           |
| ID inexistente                        | Mensaje: "Sanción no encontrada"                             | 404 Not Found             |
| Error de conexión a DB                | Mensaje: "Error interno, reintente más tarde"                | 500 Internal Server Error |

---

## Plan de Implementación
1. Crear tipos en shared y puerto en el Dominio.
2. Implementar el caso de uso UpdateDiscipline.
3. Implementar el repositorio y el controlador HTTP.
4. Actualizar formulario en React y conectar con el endpoint del backend.