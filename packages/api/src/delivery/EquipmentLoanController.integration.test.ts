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
                return id === '1'
                    ? {
                          id: '1',
                          item_name: 'Pelota',
                          status: 'Loaned',
                          loan_date: new Date('2026-05-29'),
                          due_date: new Date('2026-07-15'),
                          member_id: '1',
                      }
                    : null;
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
});
