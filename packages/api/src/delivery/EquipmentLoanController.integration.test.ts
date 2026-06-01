import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresEquipmentLoanRepository.js', () => {
    return {
        PostgresEquipmentLoanRepository: class {
            async findAll() {
                return [
                    {
                        id: '1',
                        item_name: 'Pelota',
                        status: 'Loaned',
                        loan_date: new Date('2026-05-29'),
                        due_date: new Date('2026-07-15'),
                        member_id: '1',
                    },
                ];
            }
            async findById(id: string) {
                if (id === '1') {
                    return {
                        id: '1',
                        item_name: 'Pelota',
                        status: 'Loaned',
                        loan_date: new Date('2026-05-29'),
                        due_date: new Date('2026-07-15'),
                        member_id: '1',
                    };
                }
                if (id === '2') {
                    return {
                        id: '2',
                        item_name: 'Pelota',
                        status: 'Returned',
                        loan_date: new Date('2026-05-29'),
                        due_date: new Date('2026-07-15'),
                        member_id: '1',
                    };
                }
                return null;
            }
            async create(data: any) {
                return {
                    id: 'new-loan',
                    ...data,
                    status: 'Loaned',
                    loan_date: new Date(),
                };
            }
            async update(id: string, status: string) {
                return {
                    id,
                    item_name: 'Pelota',
                    status,
                    loan_date: new Date('2026-05-29'),
                    due_date: new Date('2026-07-15'),
                    member_id: '1',
                };
            }
            async delete(_id: string) {
                return;
            }
        },
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                if (id === '1') {
                    return {
                        id: '1',
                        name: 'Socio Pleno',
                        dni: '12345678',
                        email: 'pleno@test.com',
                        birthdate: '1990-01-01',
                        category: 'Pleno',
                        status: 'Activo',
                    };
                }
                if (id === '2') {
                    return {
                        id: '2',
                        name: 'Socio Cadete',
                        dni: '87654321',
                        email: 'cadete@test.com',
                        birthdate: '2010-01-01',
                        category: 'Cadete',
                        status: 'Activo',
                    };
                }
                return null;
            }
        },
    };
});

describe('EquipmentLoan API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/prestamos', () => {
        it('debe retornar 201 y crear un préstamo exitosamente', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/prestamos',
                payload: {
                    item_name: 'Pelota de fútbol',
                    due_date: '2026-07-15',
                    member_id: '1',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeDefined();
            expect(body.data.id).toBe('new-loan');
            expect(body.data.status).toBe('Loaned');
        });

        it('debe retornar 404 si el member_id no existe', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/prestamos',
                payload: {
                    item_name: 'Pelota de fútbol',
                    due_date: '2026-07-15',
                    member_id: '999',
                },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBeDefined();
        });

        it('debe retornar 400 si el item_name está vacío', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/prestamos',
                payload: {
                    item_name: '',
                    due_date: '2026-07-15',
                    member_id: '1',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBeDefined();
        });

        it('debe retornar 400 si el due_date está en el pasado', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/prestamos',
                payload: {
                    item_name: 'Pelota',
                    due_date: '2020-01-01',
                    member_id: '1',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBeDefined();
        });

        it('debe retornar 400 si el socio es de categoría Cadete', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/prestamos',
                payload: {
                    item_name: 'Pelota de fútbol',
                    due_date: '2026-07-15',
                    member_id: '2',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('Cadete');
        });
    });

    describe('GET /api/v1/prestamos', () => {
        it('debe retornar 200 y la lista de préstamos', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/prestamos',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data.length).toBeGreaterThanOrEqual(1);
            expect(body.data[0].item_name).toBe('Pelota');
        });
    });

    describe('PUT /api/v1/prestamos/:id', () => {
        it('debe retornar 200 y actualizar el estado del préstamo', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/prestamos/1',
                payload: { status: 'Returned' },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeDefined();
            expect(body.data.status).toBe('Returned');
        });

        it('debe retornar 404 si el préstamo no existe', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/prestamos/999',
                payload: { status: 'Returned' },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('no existe');
        });

        it('debe retornar 409 si el préstamo no está en estado Loaned', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/prestamos/2',
                payload: { status: 'Damaged' },
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain(
                'Solo se pueden actualizar préstamos en estado Loaned',
            );
        });
    });

    describe('DELETE /api/v1/prestamos/:id', () => {
        it('debe retornar 204 si la eliminación es exitosa', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/prestamos/1',
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('debe retornar 204 si el préstamo no existe (idempotente)', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/prestamos/999',
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });
    });
});
