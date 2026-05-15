import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { CreatePaymentRequest } from '@alentapp/shared';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from '../application/GetPaymentByIdUseCase.js';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const payments = await this.getPaymentsUseCase.execute();
            return reply.status(200).send({ data: payments });
        } catch (error: any) {
            return reply
                .status(500)
                .send({ error: 'Error interno al obtener los pagos' });
        }
    }

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const payment = await this.getPaymentByIdUseCase.execute(id);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            if (error.message === 'El pago no existe') {
                return reply.status(404).send({ error: error.message });
            }
            return reply
                .status(500)
                .send({ error: 'Error interno al obtener el pago' });
        }
    }

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
