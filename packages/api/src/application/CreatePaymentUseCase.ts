import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentDTO, CreatePaymentRequest } from '@alentapp/shared';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly memberRepository: MemberRepository,
        private readonly paymentValidator: PaymentValidator,
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> {
        this.paymentValidator.validateRequiredFields(data);

        // 1. Validaciones de negocio
        const member = await this.memberRepository.findById(data.member_id);

        if (!member) {
            throw new Error('Socio no encontrado');
        }

        // 2. Persistencia a través de la interfaz (sin saber qué DB es)
        const nuevoPago = await this.paymentRepository.create({
            ...data,
            status: 'Pending', // todos los pagos se crean en estado pendiente
            payment_date: null,
            deleted_at: null,
        });

        return nuevoPago;
    }
}
