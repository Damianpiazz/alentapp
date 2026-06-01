import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLockerUseCase } from './UpdateLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import type { LockerDTO } from '@alentapp/shared';

//test del caso de uso de actualización de locker

/*1. existencia locker
2. normalización fecha
3. cambio automático a ocupado
4. transición inválida de estados*/

// agrupo tests del caso de uso update
describe('UpdateLockerUseCase', () => {
    // mock del repository de lockers
    const mockLockerRepo = {
        findById: vi.fn(),

        update: vi.fn(),
    } as unknown as LockerRepository;

    // mock del validador
    const mockLockerValidator = {
        validateNumberIsUnique: vi.fn(),

        validateContractDate: vi.fn(),

        validateOccupiedLocker: vi.fn(),

        validateContractWithoutMember: vi.fn(),

        validateMemberDni: vi.fn(),

        validateOccupiedStatus: vi.fn(),
    } as unknown as LockerValidator;

    // mock del repository de socios
    const mockMemberRepo = {
        findByDni: vi.fn(),
    } as unknown as MemberRepository;

    // instancia del caso de uso
    const useCase = new UpdateLockerUseCase(
        mockLockerRepo,

        mockLockerValidator,

        mockMemberRepo,
    );

    // locker base
    const mockExistingLocker: LockerDTO = {
        id: 'locker-id',

        number: '101',

        location: 'Vestuario Masculino',

        status: 'Disponible',

        member_id: null,

        contract_finish_date: null,

        contract_start_date: null,
    };

    beforeEach(() => {
        // limpia mocks entre tests
        vi.clearAllMocks();

        // limpia implementaciones anteriores
        vi.mocked(mockLockerValidator.validateContractDate).mockReset();

        // comportamiento default
        vi.mocked(mockLockerValidator.validateContractDate).mockImplementation(
            () => {},
        );

        // por defecto simula que el locker existe
        vi.mocked(mockLockerRepo.findById).mockResolvedValue(
            mockExistingLocker,
        );
    });

    it('debe lanzar error si el locker no existe', async () => {
        // sobrescribe comportamiento simulando locker inexistente
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce(null);

        // ejecuta update esperando error
        await expect(
            useCase.execute(
                'id',

                {},
            ),
        ).rejects.toThrow('El locker no existe');
    });

    it('debe rechazar fechas anteriores al día actual', async () => {
        vi.mocked(
            mockLockerValidator.validateContractDate,
        ).mockImplementationOnce(() => {
            throw new Error('Fecha inválida');
        });

        await expect(
            useCase.execute(
                'id',

                {
                    contract_finish_date: '2000-01-01',
                },
            ),
        ).rejects.toThrow();

        expect(mockLockerRepo.update).not.toHaveBeenCalled();
    });
    it('debe asignar ocupado si tiene socio', async () => {
        // simula socio existente
        vi.mocked(mockMemberRepo.findByDni).mockResolvedValueOnce({
            id: 'member-id',

            dni: '12345678',

            name: 'Test',

            email: 'test@test.com',

            birthdate: '1990-01-01',

            category: 'Pleno',

            status: 'Activo',

            created_at: '2026-01-01',
        });

        vi.mocked(mockLockerRepo.update).mockResolvedValueOnce({
            id: 'locker-id',

            number: '101',

            location: 'Vestuario Masculino',

            status: 'Disponible',

            member_id: null,

            contract_finish_date: null,

            contract_start_date: null,
        });

        // ejecuta update enviando socio
        await useCase.execute(
            'id',

            {
                member_id: '12345678',
            },
        );

        // verifica cambio automático
        expect(mockLockerRepo.update).toHaveBeenCalledWith(
            'id',

            expect.objectContaining({
                status: 'Ocupado',
            }),
        );
    });

    it('debe impedir ocupado a mantenimiento', async () => {
        // simula locker ocupado
        vi.mocked(mockLockerRepo.findById).mockResolvedValueOnce({
            ...mockExistingLocker,

            status: 'Ocupado',

            member_id: 'member-id',
        });

        // intenta transición inválida
        await expect(
            useCase.execute('id', {
                status: 'Mantenimiento',
            }),
        ).rejects.toThrow('El locker no se encuentra disponible');
    });
});
