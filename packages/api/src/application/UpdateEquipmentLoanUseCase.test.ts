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
});
