---

id: 0020
estado: Propuesto
autor: Milagros Crespo
fecha: 2026-05-02
titulo: Actualización de Alquileres de Lockers
----------------------------------------------

# TDD-0020: Actualización de Alquileres de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos modificar la información de un alquiler de locker existente, actualizando datos como la fecha de vencimiento del contrato, el socio asignado o el estado del locker.

### User Persona

* Nombre: Alberto (Tesorero/Coordinador Deportivo).
* Necesidad: Gestionar cambios sobre lockers ya asignados, como extender contratos, liberar lockers o corregir asignaciones incorrectas.

### Criterios de Aceptación

* El sistema debe permitir actualizar uno, varios o todos los campos del locker.
* El sistema debe validar que el número de locker siga siendo único en caso de modificación.
* El sistema debe validar que la fecha de vencimiento sea igual o posterior a la fecha actual.
* El sistema no debe permitir asignar un locker en estado "Mantenimiento".
* Si la edición es correcta, debe retornar los nuevos datos actualizados del locker.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial.

* Endpoint: `PUT /api/v1/lockers/:id`
* Request Body (`UpdateLockerRequest`):

```ts
{
    numero?: string;
    ubicacion?: 'Vestuario Masculino' | 'Vestuario Femenino' | 'Niños';
    estado?: 'Disponible' | 'Ocupado' | 'Mantenimiento';
    member_id?: string;
    fechaFinContrato?: string;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `LockerRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `LockerValidator` (Encargado de validar unicidad, estados y fechas).
3. **Caso de Uso**: `UpdateLockerUseCase` (Orquesta las validaciones y ejecuta la actualización).
4. **Adaptador de Salida**: `PostgresLockerRepository` (Actualización utilizando Prisma).
5. **Adaptador de Entrada**: `LockerController` (Ruta HTTP que recibe el `id` y mapea errores a códigos HTTP).

## Casos de Borde y Errores

| Escenario                       | Resultado Esperado                                               | Código HTTP               |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| Locker inexistente              | Mensaje: "El locker no existe"                                   | 404 Not Found             |
| Número ya registrado            | Mensaje: "Ya existe un locker con ese número"                    | 409 Conflict              |
| Fecha de vencimiento inválida   | Mensaje: "La fecha debe ser igual o posterior a la fecha actual" | 400 Bad Request           |
| Cambio a estado "Mantenimiento" | Bloquear asignaciones activas del locker                         | 200 OK                    |
| Error de conexión a DB          | Mensaje: "Error interno, reintente más tarde"                    | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en `@alentapp/shared` (`UpdateLockerRequest`).
2. Ampliar `LockerRepository` con el método `update`.
3. Implementar la lógica en `UpdateLockerUseCase` con las validaciones de negocio.
4. Crear la ruta `PUT /api/v1/lockers/:id` en el controlador y conectarla al backend.
5. Consumir el endpoint desde el frontend y reutilizar el formulario de creación para edición.
