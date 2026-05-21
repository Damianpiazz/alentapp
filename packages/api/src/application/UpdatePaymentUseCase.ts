import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { PaymentDTO, UpdatePaymentRequest } from '@alentapp/shared';

export class UpdatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentValidator: PaymentValidator,
    ) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {
        // 1. Buscamos el pago actual para poder validar su estado
        const existingPayment = await this.paymentRepository.findById(id);
        if (!existingPayment) {
            throw new Error('El pago no existe');
        }

        // 2. Validamos la idempotencia (que no esté ya 'Paid' o 'Canceled')
        this.paymentValidator.validateForUpdate(existingPayment.status);

        // validacion de campos
        this.paymentValidator.validateUpdateFields(data);

        // 3. Preparamos los datos a actualizar
        const paymentDataToUpdate = { ...data };

        // 4. Si la petición es para cobrar el pago, forzamos la fecha y hora actual del sistema
        if (paymentDataToUpdate.status === 'Paid') {
            paymentDataToUpdate.payment_date = new Date().toISOString();
        }

        // 5. Persistimos los cambios en la base de datos
        return await this.paymentRepository.update(id, paymentDataToUpdate);
    }
}
