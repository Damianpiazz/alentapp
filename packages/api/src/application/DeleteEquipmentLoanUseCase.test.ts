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

    it('debe eliminar el préstamo exitosamente', async () => {
        await useCase.execute('loan-1');

        expect(mockLoanRepo.delete).toHaveBeenCalledWith('loan-1');
    });

    it('debe lanzar error si ocurre un fallo en la base de datos', async () => {
        vi.mocked(mockLoanRepo.delete).mockRejectedValueOnce(
            new Error('Error de conexión'),
        );

        await expect(useCase.execute('loan-1')).rejects.toThrow(
            'Error de conexión',
        );
    });

    it('debe ser idempotente si el préstamo no existe', async () => {
        await expect(useCase.execute('loan-999')).resolves.toBeUndefined();

        expect(mockLoanRepo.delete).toHaveBeenCalledWith('loan-999');
    });
});
