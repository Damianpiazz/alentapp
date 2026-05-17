import { PaymentRepository } from '../domain/PaymentRepository.js';

export class GetPaymentsUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute() {
        return await this.paymentRepo.findAll();
    }
}
