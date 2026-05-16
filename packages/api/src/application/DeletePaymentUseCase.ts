import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';

export class DeletePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator,
    ) {}

    async execute(id: string): Promise<void> {
        // 1. Verificamos que el pago exista en la base de datos
        const existingPayment = await this.paymentRepository.findById(id);

        if (!existingPayment) {
            throw new Error('El pago no existe');
        }

        // 2. Validamos la idempotencia (que no intente anular un pago ya procesado/Paid)
        this.paymentValidator.validateForCancel(existingPayment.status);

        // 3. Ejecutamos la anulación (Borrado Lógico)
        await this.paymentRepository.delete(id);
    }
}
