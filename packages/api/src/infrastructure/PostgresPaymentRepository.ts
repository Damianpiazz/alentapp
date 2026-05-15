import { PrismaPg } from '@prisma/adapter-pg';
import { Payment, PrismaClient } from '../generated/client/client.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment no establecido');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBPayment = {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: 'Pending' | 'Paid' | 'Overdue' | 'Canceled';
    due_date: Date;
    payment_date: Date | null;
    deleted_at: Date | null;
    member_id: string;
};

export class PostgresPaymentRepository implements PaymentRepository {
    async create(data: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO> {
        const payment = await prisma.payment.create({
            data: {
                amount: data.amount,
                month: data.month,
                year: data.year,
                status: data.status,
                due_date: new Date(data.due_date),
                payment_date: data.payment_date
                    ? new Date(data.payment_date)
                    : null,
                deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
                member_id: data.member_id,
            },
        });

        return this.mapToDTO(payment as DBPayment);
    }

    async findAll(): Promise<PaymentDTO[]> {
        const payments = await prisma.payment.findMany({
            where: { deleted_at: null },
            orderBy: { due_date: 'desc' },
        });

        return payments.map((payment) => this.mapToDTO(payment as DBPayment));
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findFirst({
            where: {
                id: id,
                deleted_at: null,
            },
        });

        return payment ? this.mapToDTO(payment as DBPayment) : null;
    }

    private mapToDTO(payment: DBPayment): PaymentDTO {
        return {
            id: payment.id,
            amount: payment.amount,
            month: payment.month,
            year: payment.year,
            status: payment.status,
            due_date: payment.due_date.toISOString(),
            payment_date: payment.payment_date
                ? payment.payment_date.toISOString()
                : null,
            deleted_at: payment.deleted_at
                ? payment.deleted_at.toISOString()
                : null,
            member_id: payment.member_id,
        };
    }
}
