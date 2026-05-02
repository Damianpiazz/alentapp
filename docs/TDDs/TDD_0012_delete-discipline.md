---
id: 0012
estado: Propuesto
autor: Lucia Meza
fecha: 2026-04-30
titulo: Eliminación de Sanción Disciplinaria
---

# TDD-0012: Eliminación de Sanción Disciplinaria

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un administrativo elimine una sanción disciplinaria registrada en el sistema, en caso de error de carga o invalidación de la sanción.

### User Personas
* **Nombre:** Administrativo
* **Necesidad:** Eliminar una sanción incorrectamente registrada o que no debería haberse aplicado.

### Criterios de Aceptación (User Stories)

- Como administrativo, quiero eliminar una sanción para corregir errores en el registro.
  - **Escenario de éxito:** Si la sanción existe, el sistema la elimina correctamente y responde con éxito.
  - **Escenario de fallo (ID inexistente):** Si el `id` no corresponde a una sanción existente, el sistema responde con error sin modificar nada.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se utilizará la entidad `Discipline` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `member_id`: Referencia al socio sancionado (FK hacia Member).
- `reason`: Cadena de texto describiendo la falta cometida.
- `start_date`: Fecha de inicio de la sanción.
- `end_date`: Fecha de fin de la sanción.
- `is_total_suspension`: Booleano.
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

**Eliminar sanción**
- **Endpoint:** `DELETE /api/v1/disciplines/:id`


### Componentes de Arquitectura Hexagonal
1. Puerto: DisciplineRepository (Interface en el Dominio).
2. Caso de Uso: DeleteDiscipline (Verifica que la sanción existe antes de eliminar).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: DisciplineController (Rutas HTTP).

---

## Casos de Borde y Errores

| Escenario              | Resultado Esperado                            | Código HTTP               |
| ---------------------- | --------------------------------------------- | ------------------------- |
| ID inexistente         | Mensaje: "Sanción no encontrada"              | 404 Not Found             |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

---

## Plan de Implementación
1. Crear tipos en shared y puerto en el Dominio.
2. Implementar el caso de uso DeleteDiscipline.
3. Implementar el repositorio y el controlador HTTP.
4. Actualizar formulario en React para incluir opción de eliminar.