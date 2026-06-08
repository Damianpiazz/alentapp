import { FastifyRequest, FastifyReply } from 'fastify';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

import { createREDMetrics, meter } from '../infrastructure/telemetry.js';

const { requestCounter, errorCounter, requestDuration, activeRequests } =
    createREDMetrics(meter);

export class SportController {
    constructor(
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const sports = await this.getSportsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({ error: error.message });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            request.log.info('Alguien pegó al endpoint de sports');
            const sport = await this.createSportUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message });
            }
            if (
                error.message.includes('inválido') ||
                error.message.includes('mayor a cero') ||
                error.message.includes('obligatorio') ||
                error.message.includes('excede') ||
                error.message.includes('numérica') ||
                error.message.includes('negativo') ||
                error.message.includes('caracteres')
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateSportRequest;
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.routeOptions?.url ?? request.url.split('?')[0];
        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(
                id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message.includes('inválido') ||
                error.message.includes('mayor a cero') ||
                error.message.includes('obligatorio') ||
                error.message.includes('excede') ||
                error.message.includes('numérica') ||
                error.message.includes('negativo') ||
                error.message.includes('caracteres')
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
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
            await this.deleteSportUseCase.execute(id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('inválido')) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}
