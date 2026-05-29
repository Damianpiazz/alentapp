import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewEquipmentLoanUseCase } from './NewEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';

describe('NewEquipmentLoanUseCase', () => {
    const mockLoanRepo = {
        create: vi.fn(),
    } as unknown as EquipmentLoanRepository;

    const mockValidator = {
        validateDueDate: vi.fn(),
        validateItemName: vi.fn(),
        validateMemberId: vi.fn(),
        validateMemberCategory: vi.fn(),
    } as unknown as EquipmentLoanValidator;

    const useCase = new NewEquipmentLoanUseCase(mockLoanRepo, mockValidator);

    const mockRequest: CreateEquipmentLoanRequest = {
        item_name: 'Pelota de fútbol',
        due_date: new Date('2026-06-15'),
        member_id: 'member-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un préstamo exitosamente cuando todas las validaciones pasan', async () => {
        vi.mocked(mockLoanRepo.create).mockResolvedValueOnce({
            id: 'loan-uuid-1',
            item_name: 'Pelota de fútbol',
            status: 'Loaned',
            loan_date: new Date('2026-05-29'),
            due_date: new Date('2026-06-15'),
            member_id: 'member-1',
        });

        const result = await useCase.execute(mockRequest);

        expect(mockValidator.validateDueDate).toHaveBeenCalledWith(
            mockRequest.due_date,
        );
        expect(mockValidator.validateItemName).toHaveBeenCalledWith(
            mockRequest.item_name,
        );
        expect(mockValidator.validateMemberId).toHaveBeenCalledWith(
            mockRequest.member_id,
        );
        expect(mockValidator.validateMemberCategory).toHaveBeenCalledWith(
            mockRequest.member_id,
        );

        expect(mockLoanRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                item_name: 'Pelota de fútbol',
                due_date: mockRequest.due_date,
                member_id: 'member-1',
                status: 'Loaned',
            }),
        );

        expect(result.id).toBe('loan-uuid-1');
        expect(result.status).toBe('Loaned');
    });

    it('debe lanzar error y no persistir si validateMemberId falla (miembro no existe)', async () => {
        vi.mocked(mockValidator.validateMemberId).mockRejectedValueOnce(
            new Error('No existe un miembro con ese id'),
        );

        await expect(useCase.execute(mockRequest)).rejects.toThrow(
            'No existe un miembro con ese id',
        );
        expect(mockLoanRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error y no persistir si validateMemberCategory falla (socio Cadete)', async () => {
        vi.mocked(mockValidator.validateMemberCategory).mockRejectedValueOnce(
            new Error('Cadete'),
        );

        await expect(useCase.execute(mockRequest)).rejects.toThrow('Cadete');
        expect(mockLoanRepo.create).not.toHaveBeenCalled();
    });
});
