---
id: 0019
estado: Propuesto
autor: Milagros Crespo  
fecha: 2026-05-02
titulo: Registro de Nuevo Alquiler de Locker
---

# TDD-0001: Registro de Nuevo Alquiler de Locker

## Contexto de Negocio (PRD)

### Objetivo

Permitir el registro de nuevos lockers, permitiendo que un administrativo dé de alta un locker de forma digital,y garantizando que el locker seleccionado se encuentre disponible y no esté en estado de mantenimiento u ocupado.

### User Persona

- Nombre: Alberto (Administrador/Coordinador Deportivo).
- Necesidad: asignar lockers a los socios de forma rápida y segura, verificando que el casillero se encuentre disponible y evitando doble asignación.

### Criterios de Aceptación

- El sistema debe validar que el número sea numérico y único.
- El sistema debe validar que la fecha de vencimiento sea igual o mayor a la fecha actual.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.
- Para dar de alta un alquiler de locker, este debe estar en estado "Disponible".

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Locker` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `numero`: Cadena de texto, único e indexado.
- `ubicacion`: Enumeración (`Vestuario Masculino`, `Vestuario Femenino`, `Niños`).
- `estado`: Enumeración (`Disponible`, `Ocupado`, `Mantenimiento`).
- `member_id`: UUID del member (FK) 
- `fechaFinContrato`: DateTime
- `fechaInicio`: Fecha de creación autogenerada.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/lockers` (Corregido según la implementación actual)
- Request Body (CreateLockerRequest):

```ts
{
    numero: string;
    ubicacion: 'Vestuario Masculino' | 'Vestuario Femenino';
    member_id: string;
    fechaFinContrato: string;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: LockerRepository (Interface en el Dominio).
2. Caso de Uso: AssignLocker (Lógica que verifica que el locker exista y esté disponible).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: LockerController (Ruta HTTP).

## Casos de Borde y Errores

```md
| Escenario                       | Resultado Esperado                                                         | Código HTTP               |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| Número de locker ya registrado  | Mensaje: "Ya existe un locker con ese número"                              | 409 Conflict              |
| Número de locker no numérico    | Mensaje: "El número de locker debe ser numérico"                           | 400 Bad Request           |
| Fecha de vencimiento inválida   | Mensaje: "La fecha de vencimiento debe ser igual o posterior a la actual"  | 400 Bad Request           |
| Locker en estado "Ocupado"      | Mensaje: "El locker seleccionado ya se encuentra ocupado"                  | 409 Conflict              |
| Locker en estado "Mantenimiento"| Mensaje: "El locker seleccionado no se encuentra disponible"               | 409 Conflict              |
| Socio inexistente               | Mensaje: "El socio especificado no existe"                                 | 404 Not Found             |
| Error de conexión a DB          | Mensaje: "Error interno, reintente más tarde"                              | 500 Internal Server Error |
```

## Plan de Implementación

## Plan de Implementación

1. Definir el esquema de persistencia para `Locker` en Prisma y ejecutar la migración correspondiente en la base de datos.
2. Crear los tipos compartidos en `@alentapp/shared` y definir el puerto `LockerRepository` en la capa de Dominio.
3. Implementar el repositorio y el caso de uso `AssignLocker` con las validaciones de negocio necesarias.
4. Crear la ruta HTTP `POST /api/v1/lockers` en el backend y conectar el formulario del frontend con el endpoint.

