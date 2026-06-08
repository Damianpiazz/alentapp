import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';
import {
    CreateDisciplineRequest,
    UpdateDisciplineRequest,
} from '@alentapp/shared';

import { createREDMetrics, meter } from '../infrastructure/telemetry.js';

const { requestCounter, errorCounter, requestDuration, activeRequests } =
    createREDMetrics(meter);

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const disciplines = await this.getDisciplinesUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: disciplines });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const discipline = await this.createDisciplineUseCase.execute(
                request.body,
            );
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message.includes('obligatorios') ||
                error.message.includes('inválido') ||
                error.message.includes('posterior')
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateDisciplineRequest;
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            const discipline = await this.updateDisciplineUseCase.execute(
                id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: discipline });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message.includes('obligatorios') ||
                error.message.includes('inválido') ||
                error.message.includes('posterior')
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
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
            await this.deleteDisciplineUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}
