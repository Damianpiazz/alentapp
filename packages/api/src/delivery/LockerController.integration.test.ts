import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateLockerRequest } from '@alentapp/shared';

/*1- Verifica que el endpoint de listado de lockers responda correctamente y retorne HTTP 200.

2- Valida la creación exitosa de un locker con datos válidos verificando respuesta HTTP 201.

3- Comprueba que el sistema rechace lockers duplicados devolviendo HTTP 400.

4- Verifica la actualización correcta de un locker existente devolviendo HTTP 200.

5- Valida que no puedan modificarse lockers inexistentes devolviendo HTTP 404.

6- Verifica que el sistema rechace eliminar lockers que ya se encuentran disponibles devolviendo HTTP 409. */

vi.mock('../infrastructure/PostgresLockerRepository.js', () => ({
    PostgresLockerRepository: class {
        // listado de lockers
        async findAll() {
            return [
                {
                    id: '1',
                    number: '101',
                    location: 'Vestuario Masculino',
                    status: 'Disponible',
                },
            ];
        }

        // búsqueda por id
        async findById(id: string) {
            return id === '1'
                ? {
                      id: '1',
                      number: '101',
                      location: 'Vestuario Masculino',
                      status: 'Disponible',
                      member_id: null,
                  }
                : null;
        }

        // validación de número duplicado
        async findByNumber(number: string) {
            return number === '101' ? { id: '1' } : null;
        }

        // creación
        async create(data: any) {
            return {
                id: '2',
                ...data,
                status: 'Disponible',
            };
        }

        // actualización
        async update(id: string, data: any) {
            return {
                id,
                ...data,
            };
        }

        // simula eliminación
        // simula eliminación exitosa
        async delete(id: string) {
            if (id !== '1') {
                throw new Error('Locker no encontrado');
            }
        }
    },
}));

vi.mock('../infrastructure/PostgresMemberRepository.js', () => ({
    PostgresMemberRepository: class {
        async findById(id: string) {
            return id === '1'
                ? {
                      id: '1',
                      name: 'Test Member',
                  }
                : null;
        }
    },
}));

vi.mock('../infrastructure/PostgresEquipmentLoanRepository.js', () => ({
    PostgresEquipmentLoanRepository: class {},
}));

vi.mock('../infrastructure/PostgresSportRepository.js', () => ({
    PostgresSportRepository: class {},
}));

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({
    PostgresDisciplineRepository: class {},
}));

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => ({
    PostgresPaymentRepository: class {},
}));

// tests de integración api lockers
describe('Locker Integration', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // levanta fastify antes de correr tests
        app = buildApp();

        await app.ready();
    });

    afterAll(async () => {
        // cierra app al finalizar
        await app.close();
    });

    it('GET lockers', async () => {
        // simula request real
        const r = await app.inject({
            method: 'GET',
            url: '/api/v1/lockers',
        });

        // verifica respuesta correcta
        expect(r.statusCode).toBe(200);
    });

    it('POST locker válido', async () => {
        // payload correcto
        const payload: CreateLockerRequest = {
            number: '200',
            location: 'Vestuario Masculino',
        };

        // request creación
        const r = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload,
        });

        // verifica creación exitosa
        expect(r.statusCode).toBe(201);
    });

    it('POST locker duplicado', async () => {
        // el mock ya conoce que 101 existe
        const r = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload: {
                number: '101',
                location: 'Vestuario Masculino',
            },
        });

        // debe devolver conflicto
        expect(r.statusCode).toBe(400);
    });

    it('PUT locker existente', async () => {
        // intenta modificar locker existente
        const r = await app.inject({
            method: 'PUT',
            url: '/api/v1/lockers/1',
            payload: {
                member_id: null,
            },
        });

        // actualización correcta
        expect(r.statusCode).toBe(200);
    });

    it('PUT locker inexistente', async () => {
        // intenta modificar locker que no existe
        const r = await app.inject({
            method: 'PUT',
            url: '/api/v1/lockers/999',
            payload: {},
        });

        // debe fallar
        expect(r.statusCode).toBe(404);
    });

    it('DELETE locker existente', async () => {
        // intenta eliminar locker existente
        const r = await app.inject({
            method: 'DELETE',

            url: '/api/v1/lockers/1',
        });

        // eliminación correcta
        expect(r.statusCode).toBe(409);
    });
});
