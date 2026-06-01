import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';

export class DeleteEquipmentLoanUseCase {
    constructor(private readonly loanRepo: EquipmentLoanRepository) {}

    async execute(id: string): Promise<void> {
        await this.loanRepo.delete(id);
    }
}
