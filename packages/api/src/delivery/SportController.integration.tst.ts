import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest } from '@alentapp/shared';

// Mock del repositorio (evita DB real)
vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findByName(name: string) {
                return name === 'Fútbol' ? { id: '1', name: 'Fútbol' } : null;
            }

            async create(data: any) {
                return {
                    id: '2',
                    ...data,
                    created_at: new Date().toISOString(),
                };
            }
        },
    };
});

describe('Sport API Integration Tests (CREATE)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/sports', () => {
        it('debe retornar 201 y crear el deporte correctamente', async () => {
            const payload: CreateSportRequest = {
                name: 'Fútbol',
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(201);

            const body = JSON.parse(response.payload);

            expect(body.data.id).toBeDefined();
            expect(body.data.name).toBe('Fútbol');
        });

        it('debe retornar 409 si el deporte ya existe', async () => {
            const payload: CreateSportRequest = {
                name: 'Fútbol', // mockeado como existente
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(409);

            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un deporte con ese nombre');
        });

        it('debe retornar 400 si el nombre es inválido', async () => {
            const payload: CreateSportRequest = {
                name: '   ', // inválido (espacios)
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(400);
        });

        it('debe retornar 400 si max_capacity es inválido', async () => {
            const payload: any = {
                name: 'Basket',
                description: 'Deporte',
                max_capacity: 0, // inválido
                additional_price: 10,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(400);
        });
    });
});
