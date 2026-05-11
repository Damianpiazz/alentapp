import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportController } from './SportController.js';
describe('SportController', () => {
    const mockGetUseCase = { execute: vi.fn() };
    const mockCreateUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };
    const controller = new SportController(
        mockGetUseCase as any,
        mockCreateUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any,
    );
    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };
    const mockRequest = {
        log: { info: vi.fn() },
        body: {
            name: 'Fútbol',
            description: 'Deporte en equipo',
            max_capacity: 22,
            additional_price: 10,
            requires_medical_certificate: false,
        },
        params: { id: 'sport-1' },
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('getAll', () => {
        it('debe devolver status 200 y la lista de deportes', async () => {
            const mockSports = [{ id: '1', name: 'Fútbol' }];
            mockGetUseCase.execute.mockResolvedValueOnce(mockSports);
            await controller.getAll(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSports });
        });
        it('debe devolver status 500 si falla el caso de uso', async () => {
            mockGetUseCase.execute.mockRejectedValueOnce(new Error('DB Falló'));
            await controller.getAll(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'DB Falló' });
        });
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
    describe('update', () => {
        it('debe devolver status 200 y los datos si se actualiza correctamente', async () => {
            const mockSport = { id: 'sport-1', max_capacity: 30 };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockSport);
            await controller.update(mockRequest as any, mockReply as any);
            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(
                'sport-1',
                mockRequest.body,
            );
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport });
        });
        it('debe devolver status 404 si el deporte no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('El deporte solicitado no existe'),
            );
            await controller.update(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El deporte solicitado no existe',
            });
        });
        it('debe devolver status 400 si max_capacity es inválido', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('La capacidad máxima debe ser mayor a cero'),
            );
            await controller.update(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(400);
        });
        it('debe devolver status 500 ante un error genérico', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('Generic failure'),
            );
            await controller.update(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Error interno, reintente más tarde',
            });
        });
    });
    describe('delete', () => {
        it('debe devolver status 204 si la eliminación es exitosa', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);
            await controller.delete(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });
        it('debe devolver status 404 si el deporte no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(
                new Error('El deporte no existe'),
            );
            await controller.delete(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El deporte no existe',
            });
        });
        it('debe devolver status 400 si el id es inválido', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(
                new Error('Identificador inválido'),
            );
            await controller.delete(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Identificador inválido',
            });
        });
        it('debe devolver status 500 ante un error genérico', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(
                new Error('Generic failure'),
            );
            await controller.delete(mockRequest as any, mockReply as any);
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Error interno, reintente más tarde',
            });
        });
    });
});
