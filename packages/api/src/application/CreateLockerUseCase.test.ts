import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CreateLockerUseCase } from './CreateLockerUseCase.js';

import type { CreateLockerRequest } from '@alentapp/shared';

// tests unitarios CreateLockerUseCase:
//
// 1- crear locker válido con estado disponible
// 2- rechazar número duplicado
// 3- rechazar número no numérico
// 4- rechazar ubicación inválida

// agrupo todos los tests relacionados al caso de uso
describe('CreateLockerUseCase', () => {
    let lockerRepository: any;

    let lockerValidator: any;

    let useCase: CreateLockerUseCase;

    beforeEach(() => {
        // mock del repository
        lockerRepository = {
            create: vi.fn(),
        };

        // mock del validador
        lockerValidator = {
            validateNumber: vi.fn(),

            validateLocation: vi.fn(),

            validateNumberIsUnique: vi.fn(),
        };

        // instancia del caso de uso
        useCase = new CreateLockerUseCase(lockerRepository, lockerValidator);
    });
    // 1- CREAR LOCKER VÁLIDO CON ESTADO DISPONIBLE
    it('debe crear un locker válido con estado disponible por defecto', async () => {
        // request simulada
        const request: CreateLockerRequest = {
            number: '101',

            location: 'Vestuario Masculino',
        };

        // simulo respuesta repository
        lockerRepository.create.mockResolvedValue({
            id: 'locker-id',

            number: request.number,

            location: request.location,

            status: 'Disponible',

            member_id: null,

            contract_finish_date: null,

            contract_start_date: null,
        });

        // ejecuto lógica negocio
        const result = await useCase.execute(request);

        // verifico validación de unicidad y ubicación
        expect(lockerValidator.validateNumber).toHaveBeenCalledWith('101');

        expect(lockerValidator.validateLocation).toHaveBeenCalledWith(
            'Vestuario Masculino',
        );

        expect(lockerValidator.validateNumberIsUnique).toHaveBeenCalledWith(
            '101',
        );
        // verifico persistencia
        expect(lockerRepository.create).toHaveBeenCalled();

        // verifico estado default
        expect(result.status).toBe('Disponible');
    });
    // 2- RECHAZAR NÚMERO DUPLICADO
    it('debe rechazar número duplicado', async () => {
        const request: CreateLockerRequest = {
            number: '101',

            location: 'Vestuario Masculino',
        };

        // simulo validación fallida
        lockerValidator.validateNumberIsUnique.mockRejectedValue(
            new Error('Ya existe un locker con ese número'),
        );

        await expect(useCase.execute(request)).rejects.toThrow(
            'Ya existe un locker con ese número',
        );

        // verifica que nunca llegue a persistir
        expect(lockerRepository.create).not.toHaveBeenCalled();
    });
    // 3- RECHAZAR NÚMEROS NO NUMÉRICOS
    it('debe rechazar números no numéricos', async () => {
        const request: CreateLockerRequest = {
            number: 'abc',

            location: 'Vestuario Masculino',
        };

        // simulo que falla validación
        lockerValidator.validateNumber.mockImplementation(() => {
            throw new Error('El número de locker debe ser numérico');
        });

        await expect(useCase.execute(request)).rejects.toThrow(
            'El número de locker debe ser numérico',
        );

        // verifica que nunca persista
        expect(lockerRepository.create).not.toHaveBeenCalled();
    });
    // 4- RECHAZAR UBCACIÓN INVÁLIDA
    it('debe rechazar ubicación inválida', async () => {
        const request = {
            number: '101',

            location: 'Pileta',
        } as unknown as CreateLockerRequest;

        // simulo ubicación inválida
        lockerValidator.validateLocation.mockImplementation(() => {
            throw new Error('La ubicación seleccionada no es válida');
        });

        await expect(useCase.execute(request)).rejects.toThrow(
            'La ubicación seleccionada no es válida',
        );

        // verifica que nunca llegue a guardar
        expect(lockerRepository.create).not.toHaveBeenCalled();
    });
});
