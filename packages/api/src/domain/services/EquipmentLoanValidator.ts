import { EquipmentLoanRepository } from '../EquipmentLoanRepository.js';
import { MemberRepository } from '../MemberRepository.js';

export class EquipmentLoanValidator {
    constructor(
        private readonly loanRepo: EquipmentLoanRepository,
        private readonly memberRepo: MemberRepository,
    ) {}

    //validar member_id existe
    async validateMemberId(member_id: string): Promise<void> {
        const member = await this.memberRepo.findById(member_id);
        if (!member) {
            throw new Error('No existe un miembro con ese ID');
        }
    }
    // socio de categoria cadete no pueden solicitar prestamos
    async validateMemberIsCadete(member_id: string): Promise<void> {
        const member = await this.memberRepo.findById(member_id);
        if (!member || member.category === 'Cadete') {
            throw new Error(
                'Los miembros de categoría "Cadete" no pueden solicitar préstamos',
            );
        }
    }
    // nombre del item no vacio
    validateItemName(item_name: string): void {
        if (!item_name || item_name.trim() === '' || item_name.length < 3) {
            throw new Error('El nombre del ítem es muy corto o inválido');
        }
    }
    // due_date > loan_date(hoy)
    validateDueDate(due_date: Date): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (due_date <= today) {
            throw new Error(
                'La fecha de devolución debe ser posterior a la fecha de préstamo',
            );
        }
    }
}
