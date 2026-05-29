import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentLoanValidator } from './EquipmentLoanValidator.js';
import { EquipmentLoanRepository } from '../EquipmentLoanRepository.js';

describe('EquipmentLoanValidator', () => {
    const mockLoanRepo = {} as unknown as EquipmentLoanRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    };

    const validator = new EquipmentLoanValidator(
        mockLoanRepo,
        mockMemberRepo as any,
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateItemName', () => {
        it('debe lanzar un error si el nombre del ítem está vacío o es muy corto', () => {
            expect(() => validator.validateItemName('')).toThrow(
                'El nombre del ítem es muy corto o inválido',
            );
            expect(() => validator.validateItemName('  ')).toThrow(
                'El nombre del ítem es muy corto o inválido',
            );
            expect(() => validator.validateItemName('ab')).toThrow(
                'El nombre del ítem es muy corto o inválido',
            );
        });
    });

    describe('validateDueDate', () => {
        it('debe lanzar un error si la fecha de devolución es anterior o igual a hoy', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expect(() => validator.validateDueDate(today)).toThrow(
                'La fecha de devolución debe ser posterior a la fecha de préstamo',
            );

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            expect(() => validator.validateDueDate(yesterday)).toThrow(
                'La fecha de devolución debe ser posterior a la fecha de préstamo',
            );
        });
    });

    describe('validateMemberId', () => {
        it('debe lanzar un error si el miembro no existe', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

            await expect(
                validator.validateMemberId('member-id-inexistente'),
            ).rejects.toThrow('No existe un miembro con ese id');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith(
                'member-id-inexistente',
            );
        });
    });

    describe('validateMemberCategory', () => {
        it('debe lanzar un error si el socio es de categoría Cadete', async () => {
            vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({
                id: 'member-1',
                category: 'Cadete',
            } as any);

            await expect(
                validator.validateMemberCategory('member-1'),
            ).rejects.toThrow('Cadete');
            expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-1');
        });
    });
});
