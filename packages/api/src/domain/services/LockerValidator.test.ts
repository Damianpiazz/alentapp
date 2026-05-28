import { describe, it, expect, vi } from 'vitest';

import { LockerValidator } from './LockerValidator.js';

import { LockerRepository } from '../LockerRepository.js';

describe('LockerValidator', () => {
    const mockLockerRepo = {
        findByNumber: vi.fn(),
    } as unknown as LockerRepository;

    const validator = new LockerValidator(mockLockerRepo);

    it('debe rechazar locker ocupado sin fecha contrato', () => {
        expect(() =>
            validator.validateOccupiedLocker('12345678', null),
        ).toThrow();
    });

    it('debe rechazar fecha contrato sin socio', () => {
        expect(() =>
            validator.validateContractWithoutMember(null, '2030-01-01'),
        ).toThrow();
    });
});
