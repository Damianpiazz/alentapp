import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

describe('UpdateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        update: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateDisciplineExists: vi.fn(),
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(
        mockDisciplineRepo,
        mockDisciplineValidator,
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si la sanción no existe', async () => {
        mockDisciplineValidator.validateDisciplineExists = vi
            .fn()
            .mockRejectedValueOnce(new Error('La sanción no existe'));

        await expect(
            useCase.execute('id-inexistente', {
                reason: 'Nuevo motivo',
            }),
        ).rejects.toThrow('La sanción no existe');

        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si end_date es igual a start_date al actualizar', async () => {
        vi.mocked(
            mockDisciplineValidator.validateDisciplineExists,
        ).mockResolvedValueOnce({
            id: '1',
            member_id: '1',
            reason: 'Motivo original',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
            created_at: new Date().toISOString(),
        });

        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(
            () => {
                throw new Error(
                    'La fecha de fin debe ser posterior a la de inicio',
                );
            },
        );

        await expect(
            useCase.execute('1', {
                start_date: '2026-05-01',
                end_date: '2026-05-01',
            }),
        ).rejects.toThrow('La fecha de fin debe ser posterior a la de inicio');

        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si end_date es anterior a start_date al actualizar', async () => {
        vi.mocked(
            mockDisciplineValidator.validateDisciplineExists,
        ).mockResolvedValueOnce({
            id: '1',
            member_id: '1',
            reason: 'Motivo original',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
            created_at: new Date().toISOString(),
        });

        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(
            () => {
                throw new Error(
                    'La fecha de fin debe ser posterior a la de inicio',
                );
            },
        );

        await expect(
            useCase.execute('1', {
                start_date: '2026-06-01',
                end_date: '2026-05-01',
            }),
        ).rejects.toThrow('La fecha de fin debe ser posterior a la de inicio');

        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe actualizar correctamente solo el motivo sin tocar las fechas', async () => {
        const existing = {
            id: '1',
            member_id: '1',
            reason: 'Motivo original',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
            created_at: new Date().toISOString(),
        };
        const updated = { ...existing, reason: 'Motivo actualizado' };

        vi.mocked(
            mockDisciplineValidator.validateDisciplineExists,
        ).mockResolvedValueOnce(existing);
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce(updated);

        const result = await useCase.execute('1', {
            reason: 'Motivo actualizado',
        });

        expect(mockDisciplineRepo.update).toHaveBeenCalledWith('1', {
            reason: 'Motivo actualizado',
        });
        expect(result.reason).toBe('Motivo actualizado');
    });
});
