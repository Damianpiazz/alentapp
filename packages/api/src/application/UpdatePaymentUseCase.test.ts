import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentDTO, UpdatePaymentRequest } from '@alentapp/shared';

describe('UpdatePaymentUseCase', () => {
    // 1. mocks de puerto y servicio
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const mockPaymentValidator = {
        validateForUpdate: vi.fn(),
        validateUpdateFields: vi.fn(),
    } as unknown as PaymentValidator;

    // 2. instancio el caso de uso
    const useCase = new UpdatePaymentUseCase(
        mockPaymentRepo,
        mockPaymentValidator,
    );

    // datos de prueba
    const mockPayment: PaymentDTO = {
        id: 'payment-123',
        amount: 5000,
        month: 10,
        year: 2026,
        status: 'Pending',
        due_date: '2026-10-15',
        payment_date: null,
        deleted_at: null,
        member_id: 'member-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // simulo que el pago existe
        vi.mocked(mockPaymentRepo.findById).mockResolvedValue(
            mockPayment as unknown as PaymentDTO,
        );
    });

    //test1
    it('debe lanzar error si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('none', {})).rejects.toThrow(
            'El pago no existe',
        );
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    //test2
    it('debe actualizar el estado a Paid y registrar fecha de pago', async () => {
        const updateData: UpdatePaymentRequest = { status: 'Paid' };
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockPayment,
            ...updateData,
            payment_date: '2026-05-28T00:00:00.000Z',
        } as unknown as PaymentDTO);

        const result = await useCase.execute('payment-123', updateData);

        expect(mockPaymentValidator.validateForUpdate).toHaveBeenCalledWith(
            'Pending',
        );
        expect(mockPaymentRepo.update).toHaveBeenCalledWith(
            'payment-123',
            expect.objectContaining({
                status: 'Paid',
                payment_date: expect.any(String), // verifico que se asignó la fecha
            }),
        );
        expect(result.status).toBe('Paid');
    });

    //test3
    it('debe actualizar otros campos válidos sin modificar la fecha de pago', async () => {
        const updateData: UpdatePaymentRequest = { amount: 6000 };
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockPayment,
            ...updateData,
        } as unknown as PaymentDTO);

        await useCase.execute('payment-123', updateData);

        expect(mockPaymentRepo.update).toHaveBeenCalledWith(
            'payment-123',
            expect.objectContaining({
                amount: 6000,
            }),
        );
        // verifico que no se haya forzado el cambio a Paid
        expect(mockPaymentRepo.update).not.toHaveBeenCalledWith(
            'payment-123',
            expect.objectContaining({
                payment_date: expect.any(String),
            }),
        );
    });

    //test4
    it('debe llamar al validador de campos en cada actualización', async () => {
        const updateData: UpdatePaymentRequest = { amount: 7000 };
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce(
            {} as unknown as PaymentDTO,
        );

        await useCase.execute('payment-123', updateData);

        expect(mockPaymentValidator.validateUpdateFields).toHaveBeenCalledWith(
            updateData,
        );
    });

    //test5
    it('debe actualizar el estado a Canceled sin asignar payment_date', async () => {
        const updateData: UpdatePaymentRequest = {
            status: 'Canceled',
        };

        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockPayment,
            status: 'Canceled',
        } as unknown as PaymentDTO);

        const result = await useCase.execute('payment-123', updateData);

        expect(mockPaymentValidator.validateForUpdate).toHaveBeenCalledWith(
            'Pending',
        );

        expect(result.status).toBe('Canceled');

        expect(mockPaymentRepo.update).toHaveBeenCalledWith(
            'payment-123',
            expect.not.objectContaining({
                payment_date: expect.any(String),
            }),
        );
    });
});
