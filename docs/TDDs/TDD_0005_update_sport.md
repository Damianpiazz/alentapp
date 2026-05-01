---
id: 0005
estado: Propuesto
autor: Damian Piazza
fecha: 2026-05-01
titulo: Actualización de Deportes Existentes
---

# TDD-0005: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir la actualización de la información de un deporte, como su descripción, precio o cupo, manteniendo la integridad del nombre original de la disciplina como campo inmutable.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Modificar la descripción o actualizar el límite de capacidad de un deporte a medida que crecen las instalaciones del club, sin riesgo de alterar el nombre oficial de la disciplina.

### Criterios de Aceptación

- El sistema debe impedir la modificación del nombre (`name`) después de la creación, tratándolo como un campo inmutable.
- El sistema solo debe permitir la edición de `description`, `max_capacity`, `additional_price` y `requires_medical_certificate`.
- El sistema debe validar que, si se envía `max_capacity`, su valor sea mayor a cero.
- Si la edición es correcta, debe retornar los nuevos datos del deporte actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial. El campo `name` se excluye explícitamente del tipo.

- Endpoint: `PUT /api/v1/sports/:id`
- Request Body (`UpdateSportRequest`):

```ts
{
    description?: string;
    max_capacity?: number;
    additional_price?: number;
    requires_medical_certificate?: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `SportValidator` (Reutiliza la validación de `max_capacity` > 0 y descarta el atributo `name` si viniera en el payload).
3. **Caso de Uso**: `UpdateSportUseCase` (Orquesta la validación, aplica la regla de inmutabilidad del nombre y llama al repositorio).
4. **Adaptador de Salida**: `PostgresSportRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                      | Código HTTP               |
| -------------------------------- | ------------------------------------------------------- | ------------------------- |
| Intento de cambiar el `name`     | Mensaje: "El nombre es inmutable" o se ignora silenciosamente | 400 Bad Request     |
| `max_capacity` enviado <= 0      | Mensaje: "La capacidad máxima debe ser mayor a cero"    | 400 Bad Request           |
| Deporte inexistente              | Mensaje: "El deporte solicitado no existe"              | 404 Not Found             |
| Error de conexión a DB           | Mensaje: "Error interno, reintente más tarde"           | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `UpdateSportRequest` en `@alentapp/shared` excluyendo explícitamente el campo `name`.
2. Ampliar el `SportRepository` (dominio) y `PostgresSportRepository` (infraestructura) con el método `update`.
3. Desarrollar `UpdateSportUseCase` aplicando la regla de inmutabilidad del nombre y la validación de capacidad mediante `SportValidator`.
4. Configurar la ruta `PUT /api/v1/sports/:id` en `SportController` y registrarla en `app.ts`.
5. Consumir el endpoint desde el Frontend reutilizando el modal de creación para permitir la edición.