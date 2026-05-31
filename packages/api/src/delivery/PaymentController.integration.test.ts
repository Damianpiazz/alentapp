import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';

// 1. mock del repositorio de Socios para poder validar la existencia del socio al crear un pago
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === 'socio-valido'
                    ? { id: 'socio-valido', name: 'Socio de Prueba' }
                    : null;
            }
            async findAll() {
                return [];
            }
            async findByDni() {
                return null;
            }
            async create() {}
            async update() {}
            async delete() {}
        },
    };
});

// 2. mock del repositorio de Pagos simulando distintos estados
vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async findAll() {
                return [
                    {
                        id: '1',
                        amount: 1500,
                        status: 'Pending',
                        member_id: 'socio-valido',
                    },
                ];
            }
            async findById(id: string) {
                if (id === '1')
                    return {
                        id: '1',
                        amount: 1500,
                        status: 'Pending',
                        member_id: 'socio-valido',
                    };
                if (id === '2')
                    return {
                        id: '2',
                        amount: 2000,
                        status: 'Paid',
                        member_id: 'socio-valido',
                    }; // Pago ya procesado
                if (id === '3')
                    return {
                        id: '3',
                        amount: 3000,
                        status: 'Canceled',
                        member_id: 'socio-valido',
                    }; // Pago anulado
                return null; // ID inexistente
            }
            async create(data: CreatePaymentRequest) {
                return { id: 'nuevo-pago', ...data, status: 'Pending' };
            }
            async update(id: string, data: UpdatePaymentRequest) {
                return { id, ...data };
            }
            async delete(id: string) {
                return;
            }
        },
    };
});

// todos estos mocks son porque saltaba error sin ellos
vi.mock('../infrastructure/PostgresEquipmentLoanRepository.js', () => {
    return {
        PostgresEquipmentLoanRepository: class {},
    };
});

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {},
    };
});

vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {},
    };
});

describe('Payment API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready(); // espera que los plugins de Fastify terminen de cargar
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/payments', () => {
        //test1
        it('debe retornar código 200 y el listado de pagos', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/payments',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('1');
            expect(body.data[0].status).toBe('Pending');
        });
    });

    describe('GET /api/v1/payments/:id', () => {
        //test2
        it('debe retornar 200 y los datos del pago solicitado', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/payments/1',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('1');
        });

        //test3
        it('debe retornar 404 si el pago no existe', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/payments/999',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago no existe');
        });
    });

    describe('POST /api/v1/payments', () => {
        //test4
        it('debe retornar 201 y crear el pago exitosamente', async () => {
            const payload: CreatePaymentRequest = {
                amount: 1500,
                month: 10,
                year: 2024,
                due_date: '2024-10-10T00:00:00.000Z',
                member_id: 'socio-valido',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.amount).toBe(1500);
            expect(body.data.status).toBe('Pending');
            expect(body.data.id).toBeDefined();
        });

        //test5
        it('debe retornar 404 si el socio no existe', async () => {
            const payload: CreatePaymentRequest = {
                amount: 1500,
                month: 10,
                year: 2024,
                due_date: '2024-10-10T00:00:00.000Z',
                member_id: 'socio-invalido',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('Socio no encontrado');
        });

        //test6
        it('debe retornar 400 si el monto es cero o negativo (Valor Límite)', async () => {
            const payload = {
                amount: 0, // Invalido
                month: 10,
                year: 2024,
                due_date: '2024-10-10T00:00:00.000Z',
                member_id: 'socio-valido',
            } as CreatePaymentRequest;

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El monto debe ser mayor a cero');
        });
    });

    describe('PUT /api/v1/payments/:id', () => {
        //test7
        it('debe retornar 200 al actualizar exitosamente un pago en estado Pending', async () => {
            const payload: UpdatePaymentRequest = {
                status: 'Paid',
            };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/1', // ID 1 = Pending en el mock
                payload,
            });

            expect(response.statusCode).toBe(200);
        });

        //test8
        it('debe retornar 409 si se intenta actualizar un pago que ya está procesado', async () => {
            const payload: UpdatePaymentRequest = {
                status: 'Pending',
            };

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/2', // ID 2 = Paid en el mock
                payload,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago ya se encuentra procesado');
        });
    });

    describe('DELETE /api/v1/payments/:id', () => {
        //test9
        it('debe retornar 200 y mensaje de éxito si el pago es anulado', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/1', // ID 1 = Pending en el mock
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.message).toBe('Pago anulado exitosamente');
        });

        //test10
        it('debe retornar 409 al intentar anular un pago ya pagado', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/2', // ID 2 = Paid en el mock
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('No se puede anular un pago ya procesado');
        });

        //test11
        it('debe retornar 404 si el pago a anular no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/payments/999',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago no existe');
        });
    });
});
