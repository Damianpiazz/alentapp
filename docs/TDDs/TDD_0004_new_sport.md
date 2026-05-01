---
id: 0004
estado: Propuesto
autor: Damian Piazza
fecha: 2026-05-01
titulo: Registro de Nuevos Deportes
---

# TDD-0004: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administradores del club registrar nuevas disciplinas deportivas en el sistema para que posteriormente los socios puedan inscribirse en ellas.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Necesita dar de alta nuevos deportes que se empezarán a dictar en el club de forma rápida, especificando si tienen costo extra, restricciones médicas y cupos.

### Criterios de Aceptación

- El sistema debe validar que la capacidad máxima (`max_capacity`) sea mayor a cero.
- El sistema debe validar que el nombre del deporte (`name`) sea único.
- El deporte se debe crear correctamente con sus precios adicionales y requerimientos de apto médico.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:

- `id`: UUID (PK).
- `name`: Cadena de texto, único (UK).
- `description`: Cadena de texto.
- `max_capacity`: Entero.
- `additional_price`: Número decimal.
- `requires_medical_certificate`: Booleano.

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición de creación.

- Endpoint: `POST /api/v1/sports`
- Request Body (`CreateSportRequest`):

```ts
{
  name: string;
  description: string;
  max_capacity: number;
  additional_price: number;
  requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository`.
2. **Servicio de Dominio**: `SportValidator` (asegura `max_capacity > 0` y normaliza datos).
3. **Caso de Uso**: `CreateSportUseCase` (orquesta validación y persistencia).
4. **Adaptador de Salida**: `PostgresSportRepository` (Prisma).
5. **Adaptador de Entrada**: `SportController` (ruta HTTP en Fastify).

## Casos de Borde y Errores

| Escenario                                | Resultado Esperado                                                         | Código HTTP               |
| ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| ID generado inválido                     | Mensaje: "No se pudo generar identificador válido"                         | 500 Internal Server Error |
| Nombre vacío                             | Mensaje: "El nombre del deporte es obligatorio"                            | 400 Bad Request           |
| Nombre con solo espacios                 | Mensaje: "El nombre del deporte es inválido"                               | 400 Bad Request           |
| Nombre demasiado extenso                 | Mensaje: "El nombre excede el máximo permitido"                            | 400 Bad Request           |
| Nombre de deporte duplicado              | Mensaje: "Ya existe un deporte con ese nombre"                             | 409 Conflict              |
| `description` vacía                      | Mensaje: "La descripción es obligatoria"                                   | 400 Bad Request           |
| `description` demasiado extensa          | Mensaje: "La descripción excede el máximo permitido"                       | 400 Bad Request           |
| `max_capacity` faltante                  | Mensaje: "La capacidad máxima es obligatoria"                              | 400 Bad Request           |
| `max_capacity` <= 0                      | Mensaje: "La capacidad máxima debe ser mayor a cero"                       | 400 Bad Request           |
| `max_capacity` no numérico               | Mensaje: "La capacidad máxima debe ser numérica"                           | 400 Bad Request           |
| `additional_price` negativo              | Mensaje: "El precio adicional no puede ser negativo"                       | 400 Bad Request           |
| `additional_price` no numérico           | Mensaje: "El precio adicional debe ser numérico"                           | 400 Bad Request           |
| Payload mal formado                      | Mensaje: "Solicitud inválida"                                              | 400 Bad Request           |
| Error de conexión a DB                   | Mensaje: "Error interno, reintente más tarde"                              | 500 Internal Server Error |
| Creación exitosa                         | Retorna deporte creado                                                     | 201 Created               |

## Plan de Implementación

1. Actualizar `schema.prisma` agregando el modelo `Sport` y generar migración.
2. Definir contratos y DTOs en `@alentapp/shared`.
3. Crear `SportRepository` y `SportValidator`.
4. Implementar `CreateSportUseCase`.
5. Construir `PostgresSportRepository`.
6. Exponer endpoint en `SportController`.
