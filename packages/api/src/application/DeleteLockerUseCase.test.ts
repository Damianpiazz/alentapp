import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DeleteLockerUseCase } from './DeleteLockerUseCase.js';

import { LockerRepository } from '../domain/LockerRepository.js';

import type { LockerDTO } from '@alentapp/shared';

// tests del caso de uso liberar locker

/*

1. liberar locker ocupado
2. impedir liberar locker disponible

*/

describe('DeleteLockerUseCase', () => {
    // mock repository
    const mockLockerRepo = {
        findById: vi.fn(),

        delete: vi.fn(),
    } as unknown as LockerRepository;

    // instancia caso uso
    const useCase = new DeleteLockerUseCase(mockLockerRepo);

    // locker base
    const mockLocker: LockerDTO = {
        id: 'locker-id',

        number: '101',

        location: 'Vestuario Masculino',

        status: 'Ocupado',

        member_id: 'member-id',

        contract_finish_date: null,

        contract_start_date: null,
    };

    beforeEach(() => {
        // limpia mocks
        vi.clearAllMocks();

        // comportamiento default
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(mockLocker);
    });

    it('debe liberar locker ocupado correctamente', async () => {
        // simula delete exitoso
        vi.mocked(mockLockerRepo.delete).mockResolvedValueOnce(undefined);

        await useCase.execute('locker-id');

        // verifica llamada
        expect(mockLockerRepo.delete).toHaveBeenCalledWith('locker-id');
    });

    it('debe rechazar locker disponible', async () => {
        // simula locker libre
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce({
            ...mockLocker,

            status: 'Disponible',
        });

        await expect(useCase.execute('locker-id')).rejects.toThrow(
            'El locker ya se encuentra disponible',
        );

        // nunca debe liberar
        expect(mockLockerRepo.delete).not.toHaveBeenCalled();
    });
});
