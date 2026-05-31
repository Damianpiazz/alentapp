import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisciplineController } from './DisciplineController.js';

describe('DisciplineController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new DisciplineController(
        mockCreateUseCase as never,
        mockGetUseCase as never,
        mockUpdateUseCase as never,
        mockDeleteUseCase as never,
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    const mockRequest = {
        body: {
            member_id: '1',
            reason: 'Conducta inapropiada',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
        },
        params: { id: '1' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver 201 si la sanción se crea correctamente', async () => {
            const mockDiscipline = { id: '1', ...mockRequest.body };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockDiscipline);

            await controller.create(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({
                data: mockDiscipline,
            });
        });

        it('debe devolver 404 si el socio no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('El socio indicado no existe'),
            );

            await controller.create(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El socio indicado no existe',
            });
        });

        it('debe devolver 400 si las fechas son inválidas', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('La fecha de fin debe ser posterior a la de inicio'),
            );

            await controller.create(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(400);
        });

        it('debe devolver 500 ante un error de base de datos', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('DB error'),
            );

            await controller.create(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Error interno, reintente más tarde',
            });
        });
    });

    describe('update', () => {
        it('debe devolver 200 si la sanción se actualiza correctamente', async () => {
            const mockUpdated = { id: '1', reason: 'Motivo actualizado' };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockUpdated);

            await controller.update(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockUpdated });
        });

        it('debe devolver 404 si la sanción no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('La sanción no existe'),
            );

            await controller.update(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(404);
        });
    });

    describe('delete', () => {
        it('debe devolver 204 si la sanción se elimina correctamente', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);

            await controller.delete(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe devolver 404 si la sanción no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(
                new Error('La sanción no existe'),
            );

            await controller.delete(mockRequest as never, mockReply as never);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'La sanción no existe',
            });
        });
    });
});
