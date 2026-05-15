import { EquipmentLoanDTO } from '@alentapp/shared';
import { EquipmentLoanStatus } from '../generated/client/edge.js';

export interface EquipmentLoanRepository {
    create(loan: Omit<EquipmentLoanDTO, 'id'>): Promise<EquipmentLoanDTO>;
    update(id: string, status: EquipmentLoanStatus): Promise<EquipmentLoanDTO>;

    findById(id: string): Promise<EquipmentLoanDTO | null>;
    findAll(): Promise<EquipmentLoanDTO[]>;
}
