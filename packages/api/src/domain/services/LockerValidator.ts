import { LockerRepository } from '../LockerRepository.js';

export class LockerValidator {
    constructor(private readonly lockerRepo: LockerRepository) {}

    validateNumber(number: string) {
        if (!/^\d+$/.test(number)) {
            throw new Error('El número de locker debe ser numérico');
        }
    }

    validateLocation(location: string) {
        const validLocations = [
            'Vestuario Masculino',
            'Vestuario Femenino',
            'Niños',
        ];

        if (!validLocations.includes(location)) {
            throw new Error('La ubicación seleccionada no es válida');
        }
    }

    async validateNumberIsUnique(number: string) {
        const existing = await this.lockerRepo.findByNumber(number);

        if (existing) {
            throw new Error('Ya existe un locker con ese número');
        }
    }
}
