import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { CreatePaymentRequest } from '@alentapp/shared';

export class PaymentController {
    constructor(private readonly createPaymentUseCase: CreatePaymentUseCase) {}

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const payment = await this.createPaymentUseCase.execute(
                request.body,
            );

            return reply.status(201).send({ data: payment });
        } catch (error: any) {
            // 404: El socio no existe
            if (error.message.includes('Socio no encontrado')) {
                return reply.status(404).send({ error: error.message });
            }

            // 400: Faltan datos
            if (error.message.includes('faltan')) {
                return reply.status(400).send({ error: error.message });
            }

            // 500: Error de base de datos
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
