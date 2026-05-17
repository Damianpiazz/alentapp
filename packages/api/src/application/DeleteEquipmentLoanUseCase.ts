import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';

export class DeleteEquipmentLoanUseCase {
    constructor(private readonly loanRepo: EquipmentLoanRepository) {}

    async execute(id: string): Promise<void> {
        // Validar existencia del préstamo
        const existingLoan = await this.loanRepo.findById(id);
        if (!existingLoan) {
            throw new Error('El préstamo no existe');
        }
        await this.loanRepo.delete(id);
    }
}
