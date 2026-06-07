import { FastifyRequest, FastifyReply } from 'fastify';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }
    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Alguien pegó al endpoint de sports');
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe un deporte con ese nombre')) {
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
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateSportRequest;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(
                id,
                request.body,
            );
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
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
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteSportUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('inválido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
}
