import {
    PaymentStatus,
    UpdatePaymentRequest,
    CreatePaymentRequest,
} from '@alentapp/shared';

export class PaymentValidator {
    // TDD-0013: Validar que no falten datos al crear
    validateRequiredFields(data: CreatePaymentRequest): void {
        const missingFields = [];

        if (data.amount === undefined || data.amount === null)
            missingFields.push('amount');
        if (!data.month) missingFields.push('month');
        if (!data.year) missingFields.push('year');
        if (!data.due_date) missingFields.push('due_date');
        if (!data.member_id) missingFields.push('member_id');

        if (missingFields.length > 0) {
            throw new Error(
                `Faltan datos obligatorios: ${missingFields.join(', ')}`,
            );
        }

        if (data.amount <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
    }

    // TDD-0014: Validar idempotencia para la actualización/cobro + validar monto positivo
    validateForUpdate(currentStatus: PaymentStatus): void {
        if (currentStatus === 'Paid') {
            throw new Error('El pago ya se encuentra procesado');
        }
        if (currentStatus === 'Canceled') {
            throw new Error('No se puede modificar un pago que fue anulado');
        }
    }

    validateUpdateFields(data: UpdatePaymentRequest): void {
        // Tipado fuerte aquí
        if (data.amount !== undefined && data.amount <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
    }

    // TDD-0015: Validar idempotencia para la anulación
    validateForCancel(currentStatus: PaymentStatus): void {
        if (currentStatus === 'Paid') {
            throw new Error('No se puede anular un pago ya procesado');
        }
    }
}
