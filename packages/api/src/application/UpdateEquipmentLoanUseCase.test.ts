import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateEquipmentLoanUseCase } from './UpdateEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';

describe('UpdateEquipmentLoanUseCase', () => {
    const mockLoanRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as EquipmentLoanRepository;

    const mockValidator = {
        validateState: vi.fn(),
    } as unknown as EquipmentLoanValidator;

    const useCase = new UpdateEquipmentLoanUseCase(mockLoanRepo, mockValidator);

    const existingLoan = {
        id: 'loan-1',
        item_name: 'Pelota',
        status: 'Loaned' as const,
        loan_date: new Date('2026-05-29'),
        due_date: new Date('2026-07-15'),
        member_id: 'member-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el préstamo no existe', async () => {
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('loan-999', 'Returned')).rejects.toThrow(
            'El préstamo no existe',
        );
        expect(mockLoanRepo.update).not.toHaveBeenCalled();
        expect(mockValidator.validateState).not.toHaveBeenCalled();
    });

    it('debe actualizar el préstamo exitosamente', async () => {
        const updatedLoan = { ...existingLoan, status: 'Returned' as const };
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(existingLoan);
        vi.mocked(mockLoanRepo.update).mockResolvedValueOnce(updatedLoan);

        const result = await useCase.execute('loan-1', 'Returned');

        expect(mockValidator.validateState).toHaveBeenCalledWith('Returned');
        expect(mockLoanRepo.update).toHaveBeenCalledWith('loan-1', 'Returned');
        expect(result.status).toBe('Returned');
        expect(result.id).toBe('loan-1');
    });

    it('debe lanzar error si el préstamo no está en estado Loaned', async () => {
        const returnedLoan = { ...existingLoan, status: 'Returned' as const };
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(returnedLoan);

        await expect(useCase.execute('loan-1', 'Demaged')).rejects.toThrow(
            'Solo se pueden actualizar préstamos en estado Loaned',
        );
        expect(mockValidator.validateState).not.toHaveBeenCalled();
        expect(mockLoanRepo.update).not.toHaveBeenCalled();
    });

    it('debe mantener los campos inmutables sin cambios', async () => {
        const updatedLoan = { ...existingLoan, status: 'Returned' as const };
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(existingLoan);
        vi.mocked(mockLoanRepo.update).mockResolvedValueOnce(updatedLoan);

        const result = await useCase.execute('loan-1', 'Returned');

        expect(result.item_name).toBe(existingLoan.item_name);
        expect(result.loan_date).toBe(existingLoan.loan_date);
        expect(result.member_id).toBe(existingLoan.member_id);
        expect(result.due_date).toBe(existingLoan.due_date);
    });
});
