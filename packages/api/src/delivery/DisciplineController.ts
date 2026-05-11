import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';
import {
    CreateDisciplineRequest,
    UpdateDisciplineRequest,
} from '@alentapp/shared';
import { ValidationError, NotFoundError } from '../domain/errors.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const disciplines = await this.getDisciplinesUseCase.execute();
            return reply.status(200).send({ data: disciplines });
        } catch (error: any) {
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const discipline = await this.createDisciplineUseCase.execute(
                request.body,
            );
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return reply.status(404).send({ error: error.message });
            }
            if (error instanceof ValidationError) {
                return reply.status(400).send({ error: error.message });
            }
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateDisciplineRequest;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const discipline = await this.updateDisciplineUseCase.execute(
                id,
                request.body,
            );
            return reply.status(200).send({ data: discipline });
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return reply.status(404).send({ error: error.message });
            }
            if (error instanceof ValidationError) {
                return reply.status(400).send({ error: error.message });
            }
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteDisciplineUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return reply.status(404).send({ error: error.message });
            }
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
