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
Permitir que un administrativo registre una sanción disciplinaria a un socio del club, definiendo el motivo, la severidad y el período de vigencia (fecha de inicio y fin). Esta información será utilizada posteriormente por el sistema para determinar restricciones sobre el socio.

### User Personas
* **Nombre**: Alberto (Administrativo) 
* **Necesidad:** Registrar una sanción indicando el motivo y el rango de fechas para dejar constancia formal de una falta cometida.

### Criterios de Aceptación 

- El sistema debe validar que `end_date` sea estrictamente posterior a `start_date`.
- El sistema debe validar que el `member_id` corresponda a un socio existente.
- Si faltan campos obligatorios (`reason`, `start_date`, `end_date`), el sistema debe rechazar la solicitud.

---

## Diseño Técnico (RFC)

### Modelo de Datos 

Se definirá la entidad `Discipline` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `member_id`: Referencia al socio sancionado (FK hacia Member).
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

### Contrato de API 

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- **Endpoint:** `POST /api/v1/disciplines`
- **Request Body (CreateDisciplineRequest):**

```ts
{
  member_id: string;
  reason: string;
  start_date: string;      
  end_date: string;         
  is_total_suspension: boolean;
}
```

### Componentes de Arquitectura Hexagonal
1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: CreateDiscipline (Valida que `end_date > start_date` antes de persistir).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Rutas HTTP).

---

## Casos de Borde y Errores

| Escenario                               | Resultado Esperado                                                        | Código HTTP               |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------- |
| Campos requeridos ausentes              | Mensaje: "Los campos motivo, start_date y end_date son obligatorios"   | 400 Bad Request           |
| `end_date` igual a `start_date`      | Mensaje: "La fecha de fin debe ser posterior a la de inicio"              | 400 Bad Request           |
| `end_date` anterior a `start_date`   | Mensaje: "La fecha de fin debe ser posterior a la de inicio"              | 400 Bad Request           |
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