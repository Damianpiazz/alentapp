import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { CreatePaymentRequest, UpdatePaymentRequest } from '@alentapp/shared';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from '../application/GetPaymentByIdUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { DeletePaymentUseCase } from '../application/DeletePaymentUseCase.js';

import { createREDMetrics, meter } from '../infrastructure/telemetry.js';

const { requestCounter, errorCounter, requestDuration, activeRequests } =
    createREDMetrics(meter);

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly deletePaymentUseCase: DeletePaymentUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const payments = await this.getPaymentsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payments });
        } catch (error) {
            const err = error as Error;
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno al obtener los pagos' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            const payment = await this.getPaymentByIdUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payment });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'El pago no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: err.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno al obtener el pago' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const payment = await this.createPaymentUseCase.execute(
                request.body,
            );
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: payment });
        } catch (error) {
            const err = error as Error;
            // 404: El socio no existe
            if (err.message.includes('Socio no encontrado')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: err.message });
            }

            // 400: Faltan datos
            if (err.message.includes('faltan')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: err.message });
            }

            // 400: Validación de monto negativo o cero
            if (err.message === 'El monto debe ser mayor a cero') {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: err.message });
            }

            // 500: Error de base de datos
            request.log.error(error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    // TDD-0014
    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdatePaymentRequest;
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            const payment = await this.updatePaymentUseCase.execute(
                id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payment });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'El pago no existe') {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: err.message });
            }

            // 400: Validación de monto negativo o cero
            if (err.message === 'El monto debe ser mayor a cero') {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: err.message });
            }

            if (
                err.message ===
                    'No se puede modificar un pago que fue anulado' ||
                err.message === 'El pago ya se encuentra procesado'
            ) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: err.message });
            }

            request.log.error(error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno al actualizar el pago' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    // TDD-0015: Borrado Lógico
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            await this.deletePaymentUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '200' });
            return reply
                .status(200)
                .send({ message: 'Pago anulado exitosamente' });
        } catch (error) {
            const err = error as Error;
            if (err.message === 'El pago no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: err.message });
            }
            if (err.message === 'No se puede anular un pago ya procesado') {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: err.message });
            }
            request.log.error(error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno al anular el pago' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}
