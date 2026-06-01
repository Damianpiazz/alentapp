import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanDTO } from '@alentapp/shared';
import { EquipmentLoanStatus } from '@alentapp/shared';

export class UpdateEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepo: EquipmentLoanRepository,
        private readonly equipmentLoanValidator: EquipmentLoanValidator,
    ) {}

    async execute(id: string, status: string): Promise<EquipmentLoanDTO> {
        // Validar que el préstamo exista
        const existingLoan = await this.equipmentLoanRepo.findById(id);
        if (!existingLoan) {
            throw new Error('El préstamo no existe');
        }

        // Validar que el préstamo esté en estado Loaned
        if (existingLoan.status !== 'Loaned') {
            throw new Error(
                'Solo se pueden actualizar préstamos en estado Loaned',
            );
        }

        // Validar el estado
        this.equipmentLoanValidator.validateState(status);
        // Cambiar string a EquipmentLoanStatus type
        const updatedStatus = status as EquipmentLoanStatus;
        // Actualizar el préstamo
        const updatedLoan = await this.equipmentLoanRepo.update(
            id,
            updatedStatus,
        );
        return updatedLoan;
    }
}
