---
id: 0010
estado: Propuesto
autor: Lucia Meza
fecha: 2026-04-30
titulo: Alta de Sancion Disciplinaria 
---

# TDD-0010: Alta de Sancion Disciplinaria 

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un administrativo registre una sanción disciplinaria a un socio del club,
definiendo el motivo, la severidad y el período de vigencia (fecha de inicio y fin).
Esta información será utilizada posteriormente por el sistema para determinar
restricciones sobre el socio.

### User Personas
* **Nombre**: Administrativo 
* **Necesidad:** registrar una sanción indicando el motivo y el rango de fechas
  para dejar constancia formal de una falta cometida.

### Criterios de Aceptación (User Stories)

- Como administrativo, quiero registrar una sanción a un socio con fecha de inicio
  y fin, para dejar constancia formal de la falta cometida.
  - **Escenario de éxito:** Si todos los campos requeridos son válidos y `fecha_fin`
    es posterior a `fecha_inicio`, el sistema guarda la sanción y responde con los
    datos creados.
  - **Escenario de fallo (fechas inválidas):** Si `fecha_fin` es igual o anterior a
    `fecha_inicio`, el sistema debe responder especificando el error y sin guardar
    el registro.
  - **Escenario de fallo (socio inexistente):** Si el `member_id` no corresponde a
    un socio existente, el sistema debe responder especificando el error y sin
    guardar el registro.
  - **Escenario de fallo (datos incompletos):** Si faltan campos obligatorios
    (`motivo`, `fecha_inicio`, `fecha_fin`), el sistema debe rechazar la solicitud.

---

## Diseño Técnico (RFC)

### Modelo de Datos 

Se definirá la entidad `Discipline` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `member_id`: Referencia al socio sancionado (FK hacia Member).
- `motivo`: Cadena de texto describiendo la falta cometida.
- `fecha_inicio`: Fecha de inicio de la sanción.
- `fecha_fin`: Fecha de fin de la sanción. Debe ser estrictamente posterior a `fecha_inicio`.
- `es_suspension_total`: Booleano. Si es `true`, el socio queda bloqueado de todas las acciones.
- `createdAt`: Fecha de creación autogenerada.

```ts
export interface Discipline {
  id: string;           
  member_id: string;    
  motivo: string;
  fecha_inicio: Date;
  fecha_fin: Date;     
  es_suspension_total: boolean;
  createdAt: Date;
}
```

### Contrato de API (Shared DTOs)

**Crear sanción**
- **Endpoint:** `POST /api/v1/disciplines`
- **Request Body (CreateDisciplineRequest):**
```ts
{
  member_id: string;
  motivo: string;
  fecha_inicio: string;      // ISO 8601, ej: "2026-05-01"
  fecha_fin: string;         // ISO 8601, ej: "2026-06-01"
  es_suspension_total: boolean;
}
```
- **Response Body (DisciplineResponse):**
```ts
{
  id: string;
  member_id: string;
  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  es_suspension_total: boolean;
  createdAt: string;
}
```

### Componentes de Arquitectura Hexagonal
1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: CreateDiscipline (Valida que `fecha_fin > fecha_inicio` antes de persistir).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Rutas HTTP).

---

## Casos de Borde y Errores

| Escenario                               | Resultado Esperado                                                        | Código HTTP               |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------- |
| Campos requeridos ausentes              | Mensaje: "Los campos motivo, fecha_inicio y fecha_fin son obligatorios"   | 400 Bad Request           |
| `fecha_fin` igual a `fecha_inicio`      | Mensaje: "La fecha de fin debe ser posterior a la de inicio"              | 400 Bad Request           |
| `fecha_fin` anterior a `fecha_inicio`   | Mensaje: "La fecha de fin debe ser posterior a la de inicio"              | 400 Bad Request           |
| Formato de fecha inválido               | Mensaje: "Formato de fecha inválido, use YYYY-MM-DD"                      | 400 Bad Request           |
| `member_id` inexistente                 | Mensaje: "El socio indicado no existe"                                    | 404 Not Found             |
| Error de conexión a DB                  | Mensaje: "Error interno, reintente más tarde"                             | 500 Internal Server Error |

---

## Plan de Implementación
1. Definir esquema de persistencia y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el caso de uso CreateDiscipline.
4. Implementar el repositorio y el controlador HTTP.
5. Crear formulario en React y conectar con el endpoint del backend.