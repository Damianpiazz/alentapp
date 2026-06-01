import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

describe('DeleteDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        delete: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateDisciplineExists: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new DeleteDisciplineUseCase(
        mockDisciplineRepo,
        mockDisciplineValidator,
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el id está vacío', async () => {
        mockDisciplineValidator.validateDisciplineExists = vi
            .fn()
            .mockRejectedValueOnce(new Error('Identificador inválido'));

        await expect(useCase.execute('')).rejects.toThrow(
            'Identificador inválido',
        );

        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la sanción no existe', async () => {
        mockDisciplineValidator.validateDisciplineExists = vi
            .fn()
            .mockRejectedValueOnce(new Error('La sanción no existe'));

        await expect(useCase.execute('id-inexistente')).rejects.toThrow(
            'La sanción no existe',
        );

        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar la sanción correctamente si existe', async () => {
        vi.mocked(
            mockDisciplineValidator.validateDisciplineExists,
        ).mockResolvedValueOnce({
            id: 'discipline-1',
        } as never);
        vi.mocked(mockDisciplineRepo.delete).mockResolvedValueOnce(undefined);

        await useCase.execute('discipline-1');

        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith('discipline-1');
    });
});
