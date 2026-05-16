import { PaymentStatus } from '@alentapp/shared';

export class PaymentValidator {
    // TDD-0013: Validar que no falten datos al crear
    validateRequiredFields(data: any): void {
        const missingFields = [];

        if (!data.amount) missingFields.push('amount');
        if (!data.month) missingFields.push('month');
        if (!data.year) missingFields.push('year');
        if (!data.due_date) missingFields.push('due_date');
        if (!data.member_id) missingFields.push('member_id');

        if (missingFields.length > 0) {
            throw new Error(
                `Faltan datos obligatorios: ${missingFields.join(', ')}`,
            );
        }
    }

    // TDD-0015: Validar idempotencia para la anulación
    validateForCancel(currentStatus: PaymentStatus): void {
        if (currentStatus === 'Paid') {
            throw new Error('No se puede anular un pago ya procesado');
        }
    }
}
