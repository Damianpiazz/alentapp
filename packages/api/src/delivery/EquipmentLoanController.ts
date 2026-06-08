import { FastifyRequest, FastifyReply } from 'fastify';
import { NewEquipmentLoanUseCase } from '../application/NewEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';
import { GetEquipmentLoanUseCase } from '../application/GetEquipmentLoanUseCase.js';
import { UpdateEquipmentLoanUseCase } from '../application/UpdateEquipmentLoanUseCase.js';
import { DeleteEquipmentLoanUseCase } from '../application/DeleteEquipmentLoanUseCase.js';

import { createREDMetrics, meter } from '../infrastructure/telemetry.js';

const { requestCounter, errorCounter, requestDuration, activeRequests } =
    createREDMetrics(meter);

export class EquipmentLoanController {
    constructor(
        private readonly createEquipmentLoanUseCase: NewEquipmentLoanUseCase,
        private readonly getEquipmentLoanUseCase: GetEquipmentLoanUseCase,
        private readonly updateEquipmentLoanUseCase: UpdateEquipmentLoanUseCase,
        private readonly deleteEquipmentLoanUseCase: DeleteEquipmentLoanUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const prestamos = await this.getEquipmentLoanUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: prestamos });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateEquipmentLoanRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            request.log.info(
                'Alguien pegó al endpoint de crear préstamo de equipo',
            );
            const payload = {
                ...request.body,
                due_date: new Date(request.body.due_date as any),
            };
            const prestamo =
                await this.createEquipmentLoanUseCase.execute(payload);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: prestamo });
        } catch (error: any) {
            if (
                error.message.includes('Cadete') ||
                error.message.includes('inválido') ||
                error.message.includes('fecha de devolución')
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('id')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            request.log.error(error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error al crear el préstamo de equipo' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { status: string };
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            const { status } = request.body;

            const updatedLoan = await this.updateEquipmentLoanUseCase.execute(
                id,
                status,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: updatedLoan });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('Loaned')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('devuelto')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            request.log.error(error);
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error al actualizar el préstamo de equipo' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            await this.deleteEquipmentLoanUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error al eliminar el préstamo de equipo' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}
