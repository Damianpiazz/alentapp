import { PaymentDTO } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida". El dominio dice:
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".

export interface PaymentRepository {
    create(payment: Omit<PaymentDTO, 'id'>): Promise<PaymentDTO>;
}
