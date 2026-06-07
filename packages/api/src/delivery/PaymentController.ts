import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from '../application/GetPaymentByIdUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly deletePaymentUseCase: DeletePaymentUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const payments = await this.getPaymentsUseCase.execute();
            return reply.status(200).send({ data: payments });
        } catch (error) {
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
        } catch (error) {
            const err = error as Error;
            if (err.message === 'El pago no existe') {
                return reply.status(404).send({ error: err.message });
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
        } catch (error) {
            const err = error as Error;
            if (err.message.includes('Socio no encontrado')) {
                return reply.status(404).send({ error: err.message });
            }
            if (err.message.includes('faltan')) {
                return reply.status(400).send({ error: err.message });
            }
            if (err.message === 'El monto debe ser mayor a cero') {
                return reply.status(400).send({ error: err.message });
            }
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdatePaymentRequest;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const payment = await this.updatePaymentUseCase.execute(
                id,
                request.body,
            );
            return reply.status(200).send({ data: payment });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'El pago no existe') {
                return reply.status(400).send({ error: err.message });
            }
            if (err.message === 'El monto debe ser mayor a cero') {
                return reply.status(400).send({ error: err.message });
            }
            if (
                err.message ===
                    'No se puede modificar un pago que fue anulado' ||
                err.message === 'El pago ya se encuentra procesado'
            ) {
                return reply.status(409).send({ error: err.message });
            }
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error interno al actualizar el pago' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deletePaymentUseCase.execute(id);
            return reply
                .status(200)
                .send({ message: 'Pago anulado exitosamente' });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'El pago no existe') {
                return reply.status(404).send({ error: err.message });
            }
            if (err.message === 'No se puede anular un pago ya procesado') {
                return reply.status(409).send({ error: err.message });
            }
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error interno al anular el pago' });
        }
    }
}
