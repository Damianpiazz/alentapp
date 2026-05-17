import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSportsUseCase } from './GetSportsUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';

describe('GetSportsUseCase', () => {
    const mockSportRepo = {
        findAll: vi.fn(),
    } as unknown as SportRepository;
    const useCase = new GetSportsUseCase(mockSportRepo);
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('debe retornar la lista de deportes', async () => {
        const mockSports = [
            { id: '1', name: 'Fútbol' },
            { id: '2', name: 'Natación' },
        ];
        vi.mocked(mockSportRepo.findAll).mockResolvedValueOnce(
            mockSports as any,
        );
        const result = await useCase.execute();
        expect(result).toEqual(mockSports);
        expect(mockSportRepo.findAll).toHaveBeenCalledOnce();
    });
});
