import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportController } from './SportController.js';

describe('SportController', () => {
    // 1. Mock del UseCase
    const mockCreateUseCase = {
        execute: vi.fn(),
    };

    const controller = new SportController(mockCreateUseCase as any);

    // 2. Mock de Fastify Reply
    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    // 3. Mock Request
    const mockRequest = {
        log: { info: vi.fn() },
        body: {
            name: 'Fútbol',
            description: 'Deporte en equipo',
            max_capacity: 22,
            additional_price: 10,
            requires_medical_certificate: false,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver 201 y el sport creado exitosamente', async () => {
            const mockSport = {
                id: '1',
                ...mockRequest.body,
                created_at: '2026-01-01T00:00:00.000Z',
            };

            mockCreateUseCase.execute.mockResolvedValueOnce(mockSport);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
                mockRequest.body,
            );

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({
                data: mockSport,
            });
        });

        it('debe devolver 409 si el deporte ya existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('Ya existe un deporte con ese nombre'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Ya existe un deporte con ese nombre',
            });
        });

        it('debe devolver 400 si hay un error de validación (inválido)', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('El nombre del deporte es inválido'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
        });

        it('debe devolver 500 para errores inesperados', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('Database connection error'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Error interno, reintente más tarde',
            });
        });
    });
});
