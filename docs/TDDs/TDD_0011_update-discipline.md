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
Permitir que un administrativo modifique los datos de una sanción disciplinaria existente como motivo, período de vigencia o tipo de suspensión, en caso de error de carga o cambio en la decision disciplinaria.

### User Personas
* **Nombre:** Alberto (Administrativo)
* **Necesidad:** Corregir o actualizar una sanción previamente registrada, ya sea por error de carga o cambio en la decisión disciplinaria.

### Criterios de Aceptación 

- El sistema debe permitir actualizar uno, varios o todos los campos de la sanción.
- El sistema debe validar que, si se modifican las fechas, `end_date` sea estrictamente posterior a `start_date`.
- Si solo se modifica una de las fechas, el sistema debe combinarla con la existente y validar la coherencia del rango.
- El `member_id` no puede ser modificado para mantener la integridad histórica.

---

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial.

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

### Componentes de Arquitectura Hexagonal
1. **Puerto**: `DisciplineRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `DisciplineValidator` (Encargado de validar coherencia del rango de fechas).
3. **Caso de Uso**: `UpdateDisciplineUseCase` (Orquesta la validación y llama al repositorio).
4. **Adaptador de Salida**: `PostgresDisciplineRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `DisciplineController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

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
1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateDisciplineRequest`).
2. Ampliar el `DisciplineRepository` con el método `update`.
3. Implementar la lógica en `UpdateDisciplineUseCase` utilizando el `DisciplineValidator`.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el Frontend reutilizando el formulario de creación para permitir la edición.