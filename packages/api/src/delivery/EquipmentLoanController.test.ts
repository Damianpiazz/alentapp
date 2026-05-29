import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentLoanController } from './EquipmentLoanController.js';

describe('EquipmentLoanController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new EquipmentLoanController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any,
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    const mockRequest = {
        log: { info: vi.fn(), error: vi.fn() },
        body: {
            item_name: 'Pelota de fútbol',
            due_date: '2026-06-15',
            member_id: 'member-1',
        },
        params: { id: 'loan-1' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockLoan = {
                id: 'loan-1',
                item_name: 'Pelota de fútbol',
                status: 'Loaned',
                loan_date: new Date('2026-05-29'),
                due_date: new Date('2026-06-15'),
                member_id: 'member-1',
            };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockLoan);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockLoan });
        });

        it('debe devolver status 404 si el member_id no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('No existe un miembro con ese id'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'No existe un miembro con ese id',
            });
        });
    });

    describe('getAll', () => {
        it('debe devolver status 200 y la lista de préstamos', async () => {
            const mockLoans = [
                { id: '1', item_name: 'Pelota', status: 'Loaned' },
                { id: '2', item_name: 'Red', status: 'Returned' },
            ];
            mockGetUseCase.execute.mockResolvedValueOnce(mockLoans);

            await controller.getAll(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockLoans });
        });
    });

    describe('update', () => {
        it('debe devolver status 200 y los datos si se actualiza correctamente', async () => {
            const updatedLoan = { id: 'loan-1', status: 'Returned' };
            mockUpdateUseCase.execute.mockResolvedValueOnce(updatedLoan);

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(
                'loan-1',
                undefined,
            );
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: updatedLoan });
        });

        it('debe devolver status 404 si el préstamo no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('El préstamo no existe'),
            );

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El préstamo no existe',
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

        it('debe devolver status 400 si el préstamo no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(
                new Error('El préstamo no existe'),
            );

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El préstamo no existe',
            });
        });
    });
});
