import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteEquipmentLoanUseCase } from './DeleteEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';

describe('DeleteEquipmentLoanUseCase', () => {
    const mockLoanRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as EquipmentLoanRepository;

    const useCase = new DeleteEquipmentLoanUseCase(mockLoanRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el préstamo no existe', async () => {
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('loan-999')).rejects.toThrow(
            'El préstamo no existe',
        );
        expect(mockLoanRepo.delete).not.toHaveBeenCalled();
    });
});
