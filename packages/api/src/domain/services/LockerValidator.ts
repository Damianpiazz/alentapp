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

    async validateNumberIsUnique(
        number: string,

        currentId?: string,
    ): Promise<void> {
        const existing = await this.lockerRepo.findByNumber(number);

        if (existing && existing.id !== currentId) {
            throw new Error('Ya existe un locker con ese número');
        }
    }

    validateContractDate(date?: string | null): void {
        if (!date) {
            return;
        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const contractDate = new Date(date);

        if (contractDate < today) {
            throw new Error(
                'La fecha debe ser igual o posterior a la fecha actual',
            );
        }
    }

    validateMaintenanceStatus(
        status?: string,

        member_id?: string | null,
    ): void {
        if (status === 'Mantenimiento' && member_id) {
            throw new Error('El locker no se encuentra disponible');
        }
    }

    validateOccupiedLocker(
        member_id?: string | null,

        contract_finish_date?: string | null,
    ): void {
        if (member_id && !contract_finish_date) {
            throw new Error('Debe ingresar una fecha de vencimiento');
        }
    }

    validateMemberDni(dni?: string | null): void {
        if (!dni) {
            return;
        }

        if (!/^\d{8}$/.test(dni)) {
            throw new Error('Ingrese un DNI correcto');
        }
    }

    validateContractWithoutMember(
        member_id?: string | null,

        contract_finish_date?: string | null,
    ): void {
        if (!member_id && contract_finish_date) {
            throw new Error('No se puede asignar fecha sin socio');
        }
    }

    validateOccupiedStatus(
        status?: string,

        member_id?: string | null,
    ): void {
        if (status === 'Ocupado' && !member_id) {
            throw new Error('Debe asignar un socio al locker');
        }
    }
}
