import { PaymentDTO, UpdatePaymentRequest } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida". El dominio dice:
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".

export interface PaymentRepository {
    create(payment: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO>;
    findAll(): Promise<PaymentDTO[]>;
    findById(id: string): Promise<PaymentDTO | null>;
    update(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO>;
}
