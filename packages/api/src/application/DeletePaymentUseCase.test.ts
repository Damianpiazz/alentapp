import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeletePaymentUseCase } from './DeletePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentDTO } from '@alentapp/shared';

describe('DeletePaymentUseCase', () => {
    // 1. mock puerto y servicio
    const mockPaymentRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as PaymentRepository;

    const mockPaymentValidator = {
        validateForCancel: vi.fn(),
    } as unknown as PaymentValidator;

    // 2. instancio el caso de uso
    const useCase = new DeletePaymentUseCase(
        mockPaymentRepo,
        mockPaymentValidator,
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    //test1
    it('debe lanzar error si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-999')).rejects.toThrow(
            'El pago no existe',
        );
        expect(mockPaymentRepo.delete).not.toHaveBeenCalled();
    });

    //test2
    it('debe lanzar error si el validador impide la cancelación', async () => {
        const mockPayment = { id: 'uuid-1', status: 'Paid' };
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(
            mockPayment as unknown as PaymentDTO,
        );

        // simulo que el validador detecta el error de negocio
        vi.mocked(
            mockPaymentValidator.validateForCancel,
        ).mockImplementationOnce(() => {
            throw new Error('No se puede anular un pago ya procesado');
        });

        await expect(useCase.execute('uuid-1')).rejects.toThrow(
            'No se puede anular un pago ya procesado',
        );
        expect(mockPaymentRepo.delete).not.toHaveBeenCalled();
    });

    //test3
    it('debe eliminar lógicamente el pago si existe y es válido', async () => {
        const mockPayment = { id: 'uuid-1', status: 'Pending' };
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(
            mockPayment as unknown as PaymentDTO,
        );

        await useCase.execute('uuid-1');

        expect(mockPaymentValidator.validateForCancel).toHaveBeenCalledWith(
            'Pending',
        );
        expect(mockPaymentRepo.delete).toHaveBeenCalledWith('uuid-1');
    });
});
