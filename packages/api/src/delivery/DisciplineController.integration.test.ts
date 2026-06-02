import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async findAll() {
                return [
                    {
                        id: '1',
                        member_id: '1',
                        reason: 'Conducta inapropiada',
                        start_date: '2026-05-01',
                        end_date: '2026-06-01',
                        is_total_suspension: false,
                        created_at: new Date().toISOString(),
                    },
                ];
            }
            async findById(id: string) {
                return id === '1'
                    ? {
                          id: '1',
                          member_id: '1',
                          reason: 'Conducta inapropiada',
                          start_date: '2026-05-01',
                          end_date: '2026-06-01',
                          is_total_suspension: false,
                          created_at: new Date().toISOString(),
                      }
                    : null;
            }
            async create(data: any) {
                return {
                    id: '2',
                    ...data,
                    created_at: new Date().toISOString(),
                };
            }
            async update(id: string, data: any) {
                return { id, ...data };
            }
            async delete(_id: string) {
                return;
            }
            async existsMember(memberId: string) {
                return memberId === '1';
            }
        },
    };
});

describe('Discipline API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/disciplines', () => {
        it('debe retornar 200 y el listado de sanciones', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/disciplines',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('1');
            expect(body.data[0].reason).toBe('Conducta inapropiada');
        });
    });

    describe('POST /api/v1/disciplines', () => {
        it('debe retornar 201 y crear la sanción', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: {
                    member_id: '1', // mockeado como existente en existsMember
                    reason: 'Conducta inapropiada',
                    start_date: '2026-05-01',
                    end_date: '2026-06-01',
                    is_total_suspension: false,
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBeDefined();
            expect(body.data.reason).toBe('Conducta inapropiada');
        });

        it('debe retornar 404 si el socio no existe', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: {
                    member_id: 'id-inexistente', // existsMember devuelve false
                    reason: 'Conducta inapropiada',
                    start_date: '2026-05-01',
                    end_date: '2026-06-01',
                    is_total_suspension: false,
                },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio indicado no existe');
        });

        it('debe retornar 400 si las fechas son inválidas', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: {
                    member_id: '1',
                    reason: 'Conducta inapropiada',
                    start_date: '2026-06-01',
                    end_date: '2026-05-01', // anterior al inicio
                    is_total_suspension: false,
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe(
                'La fecha de fin debe ser posterior a la de inicio',
            );
        });

        it('debe retornar 400 si faltan campos obligatorios', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: {
                    member_id: '1',
                    reason: '',
                    start_date: '',
                    end_date: '',
                    is_total_suspension: false,
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('PUT /api/v1/disciplines/:id', () => {
        it('debe retornar 200 si la sanción se actualiza correctamente', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/disciplines/1',
                payload: {
                    reason: 'Motivo actualizado',
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('1');
        });

        it('debe retornar 404 si la sanción no existe', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/disciplines/999',
                payload: {
                    reason: 'Motivo actualizado',
                },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/v1/disciplines/:id', () => {
        it('debe retornar 204 si se elimina correctamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/1',
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('debe retornar 404 si la sanción no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/999',
            });

            expect(response.statusCode).toBe(404);
        });
    });
});
