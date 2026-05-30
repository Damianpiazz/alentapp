import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest } from '@alentapp/shared';

// Mockeamos el repositorio para que la API entera funcione sin conectarse a la Base de Datos real
// Esto nos permite testear la integración del ciclo completo: Fastify -> Controller -> UseCase -> Validator
vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findByName(name: string) {
                return name === 'Fútbol'
                    ? {
                          id: '1',
                          name: 'Fútbol',
                          description: 'Deporte en equipo',
                          max_capacity: 22,
                          additional_price: 10,
                          requires_medical_certificate: false,
                      }
                    : null;
            }
            async findById(id: string) {
                return id === '1'
                    ? { id: '1', name: 'Fútbol', max_capacity: 22 }
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
                return id === '999' ? null : { id, ...data };
            }
            async delete(id: string) {
                if (id === '999') throw new Error('El deporte no existe');
            }
        },
    };
});
describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;
    beforeAll(async () => {
        app = buildApp();
        await app.ready(); // Esperamos a que todos los plugins (como CORS) carguen
    });
    afterAll(async () => {
        await app.close();
    });
    describe('POST /api/v1/sports', () => {
        it('debe retornar 201 y crear el deporte correctamente', async () => {
            const payload: CreateSportRequest = {
                name: 'Basket',
                description: 'Deporte de equipo',
                max_capacity: 10,
                additional_price: 0,
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
            expect(body.data.name).toBe('Basket');
        });
        it('debe retornar 409 si el nombre ya existe', async () => {
            const payload: CreateSportRequest = {
                name: 'Fútbol', // Este nombre lo mockeamos arriba como existente
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
                name: '   ',
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
            const payload: CreateSportRequest = {
                name: 'Basket',
                description: 'Deporte',
                max_capacity: 0,
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
        it('debe retornar 400 si la descripción está vacía', async () => {
            const payload: CreateSportRequest = {
                name: 'Natación',
                description: '',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: false,
            };
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });
            expect(response.statusCode).toBe(400);
        });
        it('debe retornar 400 si el precio adicional es negativo', async () => {
            const payload: CreateSportRequest = {
                name: 'Natación',
                description: 'Deporte acuático',
                max_capacity: 30,
                additional_price: -5,
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
    describe('PUT /api/v1/sports/:id', () => {
        it('debe retornar 200 si se actualiza correctamente', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/sports/1', // Sabemos que el ID 1 existe en nuestro mock
                payload: { max_capacity: 30 },
            });
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.max_capacity).toBe(30);
        });
        it('debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/sports/999', // No existe
                payload: { max_capacity: 10 },
            });
            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte solicitado no existe');
        });
    });
    describe('DELETE /api/v1/sports/:id', () => {
        it('debe retornar 204 si se elimina correctamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/1', // Sabemos que el ID 1 existe en nuestro mock
            });
            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });
        it('debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/999', // No existe
            });
            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte no existe');
        });
    });
});
