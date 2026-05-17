import { PaymentRepository } from '../domain/PaymentRepository.js';

export class GetPaymentByIdUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(id: string) {
        const payment = await this.paymentRepo.findById(id);
        if (!payment) {
            throw new Error('El pago no existe');
        }
        return payment;
    }
}
