import { EquipmentLoanDTO } from '@alentapp/shared';

export interface EquipmentLoanRepository {
    create(loan: Omit<EquipmentLoanDTO, 'id'>): Promise<EquipmentLoanDTO>;
    findById(id: string): Promise<EquipmentLoanDTO | null>;
    findAll(): Promise<EquipmentLoanDTO[]>;
}
