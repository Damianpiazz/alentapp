import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPaymentByIdUseCase } from './GetPaymentByIdUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

describe('GetPaymentByIdUseCase', () => {
    // 1. mock del puerto
    const mockPaymentRepo = {
        findById: vi.fn(),
    } as unknown as PaymentRepository;

    // 2. instancio el caso de uso
    const useCase = new GetPaymentByIdUseCase(mockPaymentRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    //test1
    it('debe retornar el pago si este existe', async () => {
        // mock
        const mockPayment = {
            id: 'payment-123',
            amount: 5000,
            status: 'Pending',
        };
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(
            mockPayment as unknown as PaymentDTO,
        );

        const result = await useCase.execute('payment-123');

        // verificacion
        expect(result).toEqual(mockPayment);
        expect(mockPaymentRepo.findById).toHaveBeenCalledWith('payment-123');
    });

    //test2
    it('debe lanzar error si el pago no existe', async () => {
        // simulo que la base de datos no encuentra el pago
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('payment-999')).rejects.toThrow(
            'El pago no existe',
        );
        expect(mockPaymentRepo.findById).toHaveBeenCalledWith('payment-999');
    });
});
