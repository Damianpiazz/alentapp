---

id: 0008
estado: Propuesto
autor: Milagros Crespo
fecha: 2026-05-03
titulo: Actualización de Locker
----------------------------------------------

---

id: 0008
estado: Propuesto
autor: Milagros Crespo
fecha: 2026-05-02
titulo: Actualización de Lockers
--------------------------------

# TDD-0008: Actualización de Locker

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos modificar la información de lockers existentes, actualizando datos como el número, ubicación, estado o asignación del locker.

### User Persona

* Nombre: Alberto (Tesorero/Coordinador Deportivo).
* Necesidad: Gestionar cambios sobre lockers registrados, como asignar lockers a socios, extender contratos o corregir datos cargados incorrectamente.

### Criterios de Aceptación

* El sistema debe permitir actualizar uno, varios o todos los campos del locker.
* El sistema debe validar que el número de locker siga siendo único en caso de modificación.
* El sistema debe validar que la fecha de vencimiento sea igual o posterior a la fecha actual.
* El sistema no debe permitir asignar un locker en estado "Mantenimiento".
* Si un locker se asigna a un socio, su estado debe pasar automáticamente a "Ocupado".
* Si un locker queda sin socio asignado, su estado debe volver automáticamente a "Disponible".
* Si un locker queda sin socio asignado, su estado debe volver automáticamente a `Disponible`.
* El sistema debe validar que el socio exista antes de asignar el locker.
* El sistema debe requerir un socio asignado cuando el estado sea `Ocupado`.
* El sistema debe limpiar automáticamente fechas y socio cuando el locker vuelva a `Disponible`.
* El sistema no debe permitir pasar un locker de `Mantenimiento` a `Ocupado` directamente.
* El sistema no debe permitir pasar un locker de `Ocupado` a `Mantenimiento` sin liberar previamente el locker.
* El sistema debe mantener el orden de los lockers en la grilla luego de editarse.
* El sistema debe mostrar el DNI del socio asociado en lugar del UUID interno.
* Si la edición es correcta, debe retornar los nuevos datos actualizados del locker.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial.

* Endpoint: `PUT /api/v1/lockers/:id`
* Request Body (`UpdateLockerRequest`):

```ts id="w3m8qa"
{
    number?: string;
    location?: 'Vestuario Masculino' | 'Vestuario Femenino' | 'Niños';
    status?: 'Disponible' | 'Ocupado' | 'Mantenimiento';
    member_id?: string | null;
    contract_finish_date?: string | null;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `LockerRepository` (Método `update(id, data)`).
2. **Servicio de Dominio**: `LockerValidator` (Encargado de validar unicidad, estados y fechas).
3. **Caso de Uso**: `UpdateLockerUseCase` (Orquesta las validaciones y actualiza automáticamente el estado según la asignación).
4. **Adaptador de Salida**: `PostgresLockerRepository` (Actualización utilizando Prisma).
5. **Adaptador de Entrada**: `LockerController` (Ruta HTTP que recibe el `id` y mapea errores a códigos HTTP).

## Transiciones

| Estado Actual | Estado Destino | Permitido |
| ------------- | -------------- | --------- |
| Disponible    | Ocupado        | Sí        |
| Disponible    | Mantenimiento  | Sí        |
| Ocupado       | Disponible     | Sí        |
| Ocupado       | Mantenimiento  | No        |
| Mantenimiento | Disponible     | Sí        |
| Mantenimiento | Ocupado        | No        |


## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                               | Código HTTP               |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| Locker inexistente               | Mensaje: "El locker no existe"                                   | 404 Not Found             |
| Número ya registrado             | Mensaje: "Ya existe un locker con ese número"                    | 409 Conflict              |
| Fecha de vencimiento inválida    | Mensaje: "La fecha debe ser igual o posterior a la fecha actual" | 400 Bad Request           |
| Locker en estado "Mantenimiento" | Mensaje: "El locker no se encuentra disponible"                  | 409 Conflict              |
| Error de conexión a DB           | Mensaje: "Error interno, reintente más tarde"                    | 500 Internal Server Error |
| Socio inexistente	                | Mensaje: "El socio no existe"	                                   | 404 Not Found             |
| Locker ocupado sin fecha de       | Mensaje: "Debe ingresar una fecha de vencimiento"                | 400 Bad Request           |
| vencimiento	                      |                                                                  |                           |
| Fecha de vencimiento sin socio    | Mensaje: "No se puede asignar fecha sin socio"                   | 400 Bad Request           |
| asignado		                      |                                                                  |                           |
| Intento de pasar de Ocupado a     | Mensaje: "El locker no se encuentra disponible"                  | 409 Conflict              |
| Mantenimiento	                    | 	                                                               |                           |
| Error de conexión a DB	          | Mensaje: "Error interno, reintente más tarde"	                   |500 Internal Server Error  |

## Plan de Implementación

1. Actualizar las interfaces en `@alentapp/shared` (`UpdateLockerRequest`).
2. Ampliar `LockerRepository` con el método `update`.
3. Implementar la lógica en `UpdateLockerUseCase` con las validaciones de negocio y actualización automática de estados.
4. Crear la ruta `PUT /api/v1/lockers/:id` en el controlador y conectarla al backend.
5. Consumir el endpoint desde el frontend y reutilizar el formulario de creación para edición.
