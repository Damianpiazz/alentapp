import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanValidator } from '../domain/services/EquipmentLoanValidator.js';
import { EquipmentLoanDTO, CreateEquipmentLoanRequest } from '@alentapp/shared';

export class NewEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository,
        private readonly equipmentLoanValidator: EquipmentLoanValidator,
    ) {}

    async execute(data: CreateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {
        // 1° validaciones
        this.equipmentLoanValidator.validateDueDate(data.due_date);
        this.equipmentLoanValidator.validateItemName(data.item_name);
        await this.equipmentLoanValidator.validateMemberId(data.member_id);
        await this.equipmentLoanValidator.validateMemberCategory(
            data.member_id,
        );

        // 2° persistencia
        const nuevoPrestamo = await this.equipmentLoanRepository.create({
            ...data,
            loan_date: new Date(),
            status: 'Loaned',
        });
        return nuevoPrestamo;
    }
}
