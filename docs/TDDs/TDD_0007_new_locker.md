---
id: 0007
estado: Propuesto
autor: Milagros Crespo
fecha: 2026-05-03
titulo: Registro de Nuevo Locker
---

# TDD-0007: Registro de Nuevo Locker

## Contexto de Negocio (PRD)

### Objetivo

Permitir el registro de nuevos lockers, posibilitando que un administrativo gestione digitalmente los casilleros disponibles para los socios.

### User Persona

- Nombre: Alberto (Administrativo / Coordinador Deportivo).
- Necesidad: Registrar lockers de forma rápida y segura, evitando números duplicados y asegurando que cada casillero quede correctamente identificado dentro del sistema.

### Criterios de Aceptación

- El sistema debe validar que el número sea numérico y único.
- El sistema debe permitir seleccionar la ubicación del locker.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.
- El locker debe registrarse con estado `Disponible` por defecto.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Locker` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `number`: Cadena de texto, único e indexado.
- `location`: Enumeración (`Vestuario Masculino`, `Vestuario Femenino`, `Niños`).
- `status`: Enumeración (`Disponible`, `Ocupado`, `Mantenimiento`). Por defecto `Disponible`.
- `member_id`: UUID del socio (FK, nullable).
- `contract_finish_date`: DateTime (nullable).
- `contract_start_date`: Fecha de creación autogenerada.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/lockers`
- Request Body (`CreateLockerRequest`):

```ts
{
  number: string;
  location: 'Vestuario Masculino' | 'Vestuario Femenino' | 'Niños';
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `LockerRepository` (Interface en el Dominio).
2. **Caso de Uso**: `CreateLockerUseCase` (lógica que valida unicidad y registra el locker).
3. **Adaptador de Salida**: `PostgresLockerRepository` (implementación real en BD usando Prisma).
4. **Adaptador de Entrada**: `LockerController` (ruta HTTP).

## Casos de Borde y Errores

| Escenario                      | Resultado Esperado                                | Código HTTP               |
| ------------------------------ | ------------------------------------------------- | ------------------------- |
| Número de locker ya registrado | Mensaje: "Ya existe un locker con ese número"     | 409 Conflict              |
| Número de locker no numérico   | Mensaje: "El número de locker debe ser numérico"  | 400 Bad Request           |
| Ubicación inválida             | Mensaje: "La ubicación seleccionada no es válida" | 400 Bad Request           |
| Error de conexión a DB         | Mensaje: "Error interno, reintente más tarde"     | 500 Internal Server Error |

## Plan de Implementación

1. Definir el esquema de persistencia para `Locker` en Prisma y ejecutar la migración correspondiente.
2. Crear los tipos compartidos en `@alentapp/shared` y definir el puerto `LockerRepository`.
3. Implementar `PostgresLockerRepository` y el caso de uso `CreateLockerUseCase`.
4. Crear la ruta HTTP `POST /api/v1/lockers` en `LockerController` y conectar el formulario del frontend.