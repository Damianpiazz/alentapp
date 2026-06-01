import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetEquipmentLoanUseCase } from './GetEquipmentLoanUseCase.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';

describe('GetEquipmentLoanUseCase', () => {
    const mockLoanRepo = {
        findAll: vi.fn(),
    } as unknown as EquipmentLoanRepository;

    const useCase = new GetEquipmentLoanUseCase(mockLoanRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista de préstamos', async () => {
        const mockLoans = [
            { id: '1', item_name: 'Pelota', status: 'Loaned' },
            { id: '2', item_name: 'Red', status: 'Returned' },
        ];
        vi.mocked(mockLoanRepo.findAll).mockResolvedValueOnce(mockLoans as any);

        const result = await useCase.execute();

        expect(result).toEqual(mockLoans);
        expect(mockLoanRepo.findAll).toHaveBeenCalledOnce();
    });
});
