import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

describe('CreateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateRequiredFields: vi.fn(),
        validateDates: vi.fn(),
        validateMemberExists: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new CreateDisciplineUseCase(
        mockDisciplineRepo,
        mockDisciplineValidator,
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si faltan campos obligatorios', async () => {
        vi.mocked(
            mockDisciplineValidator.validateRequiredFields,
        ).mockImplementationOnce(() => {
            throw new Error(
                'Los campos reason, start_date y end_date son obligatorios',
            );
        });

        await expect(
            useCase.execute({
                member_id: '1',
                reason: '',
                start_date: '',
                end_date: '',
                is_total_suspension: false,
            }),
        ).rejects.toThrow(
            'Los campos reason, start_date y end_date son obligatorios',
        );

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el formato de fecha es inválido', async () => {
        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(
            () => {
                throw new Error('Formato de fecha inválido, use YYYY-MM-DD');
            },
        );

        await expect(
            useCase.execute({
                member_id: '1',
                reason: 'Conducta inapropiada',
                start_date: 'no-es-fecha',
                end_date: '2026-06-01',
                is_total_suspension: false,
            }),
        ).rejects.toThrow('Formato de fecha inválido, use YYYY-MM-DD');

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si end_date es igual a start_date', async () => {
        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(
            () => {
                throw new Error(
                    'La fecha de fin debe ser posterior a la de inicio',
                );
            },
        );

        await expect(
            useCase.execute({
                member_id: '1',
                reason: 'Conducta inapropiada',
                start_date: '2026-05-01',
                end_date: '2026-05-01',
                is_total_suspension: false,
            }),
        ).rejects.toThrow('La fecha de fin debe ser posterior a la de inicio');

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si end_date es anterior a start_date', async () => {
        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(
            () => {
                throw new Error(
                    'La fecha de fin debe ser posterior a la de inicio',
                );
            },
        );

        await expect(
            useCase.execute({
                member_id: '1',
                reason: 'Conducta inapropiada',
                start_date: '2026-06-01',
                end_date: '2026-05-01',
                is_total_suspension: false,
            }),
        ).rejects.toThrow('La fecha de fin debe ser posterior a la de inicio');

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el socio no existe', async () => {
        vi.mocked(
            mockDisciplineValidator.validateMemberExists,
        ).mockRejectedValueOnce(new Error('El socio indicado no existe'));

        await expect(
            useCase.execute({
                member_id: 'id-inexistente',
                reason: 'Conducta inapropiada',
                start_date: '2026-05-01',
                end_date: '2026-06-01',
                is_total_suspension: false,
            }),
        ).rejects.toThrow('El socio indicado no existe');

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe crear la sanción correctamente si todos los datos son válidos', async () => {
        const mockDiscipline = {
            id: 'uuid-1',
            member_id: '1',
            reason: 'Conducta inapropiada',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
            created_at: new Date().toISOString(),
        };

        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce(
            mockDiscipline,
        );

        const result = await useCase.execute({
            member_id: '1',
            reason: 'Conducta inapropiada',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
        });

        expect(
            mockDisciplineValidator.validateRequiredFields,
        ).toHaveBeenCalledOnce();
        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledOnce();
        expect(
            mockDisciplineValidator.validateMemberExists,
        ).toHaveBeenCalledOnce();
        expect(mockDisciplineRepo.create).toHaveBeenCalledOnce();
        expect(result.id).toBe('uuid-1');
    });
});
