import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPaymentsUseCase } from './GetPaymentsUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

describe('GetPaymentsUseCase', () => {
    // 1. mock del puerto
    const mockPaymentRepo = {
        findAll: vi.fn(),
    } as unknown as PaymentRepository;

    // 2. instancio el caso de uso
    const useCase = new GetPaymentsUseCase(mockPaymentRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista completa de pagos', async () => {
        // mockeo la bd
        const mockPayments = [
            { id: 'payment-1', amount: 5000, status: 'Pending' },
            { id: 'payment-2', amount: 6000, status: 'Paid' },
        ];
        vi.mocked(mockPaymentRepo.findAll).mockResolvedValueOnce(
            mockPayments as unknown as PaymentDTO[],
        );

        // ejecuto
        const result = await useCase.execute();

        // verifico
        expect(result).toEqual(mockPayments);
        expect(mockPaymentRepo.findAll).toHaveBeenCalledOnce();
    });
});
