import { PrismaPg } from '@prisma/adapter-pg';
import {
    EquipmentLoanStatus,
    PrismaClient,
    Prisma,
} from '../generated/client/client.js';
import { EquipmentLoanRepository } from '../domain/EquipmentLoanRepository.js';
import { EquipmentLoanDTO, CreateEquipmentLoanRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBEquipmentLoan = {
    id: string;
    item_name: string;
    status: 'Loaned' | 'Returned' | 'Demaged';
    loan_date: Date;
    due_date: Date;
    member_id: string;
    deleted_at: Date | null;
};

export class PostgresEquipmentLoanRepository implements EquipmentLoanRepository {
    async create(data: CreateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {
        const loan = await prisma.equipmentLoan.create({
            data: {
                item_name: data.item_name,
                status: 'Loaned',
                loan_date: new Date(),
                due_date: data.due_date,
                member_id: data.member_id,
            },
        });

        return this.mapToDTO(loan);
    }

    async findById(id: string): Promise<EquipmentLoanDTO | null> {
        const loan = await prisma.equipmentLoan.findUnique({
            where: { id, deleted_at: null },
        });

        return loan ? this.mapToDTO(loan) : null;
    }

    async findAll(): Promise<EquipmentLoanDTO[]> {
        const loans = await prisma.equipmentLoan.findMany({
            where: { deleted_at: null },
            orderBy: { loan_date: 'desc' },
        });

        return loans.map(this.mapToDTO);
    }

    private mapToDTO(loan: DBEquipmentLoan): EquipmentLoanDTO {
        return {
            id: loan.id,
            member_id: loan.member_id,
            item_name: loan.item_name,
            status: loan.status,
            loan_date: loan.loan_date,
            due_date: loan.due_date,
        };
    }

    async update(
        id: string,
        status: EquipmentLoanStatus,
    ): Promise<EquipmentLoanDTO> {
        const updatedLoan = await prisma.equipmentLoan.update({
            where: { id },
            data: {
                status,
            },
        });
        return this.mapToDTO(updatedLoan);
    }

    async delete(id: string): Promise<void> {
        try {
            await prisma.equipmentLoan.update({
                where: { id, deleted_at: null },
                data: { deleted_at: new Date() },
            });
        } catch (error: unknown) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                return;
            }
            throw error;
        }
    }
}
