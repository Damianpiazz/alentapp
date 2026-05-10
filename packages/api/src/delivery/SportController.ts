import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';
export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
    ) {}
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
                error.message.includes('negativo')
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
                error.message.includes('negativo')
            ) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
}
