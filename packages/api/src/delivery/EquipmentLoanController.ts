import { FastifyRequest, FastifyReply } from 'fastify';
import { NewEquipmentLoanUseCase } from '../application/NewEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';
import { request } from 'https';
import { create } from 'domain';

export class EquipmentLoanController {
    constructor(
        private readonly createEquipmentLoanUseCase: NewEquipmentLoanUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateEquipmentLoanRequest }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info(
                'Alguien pegó al endpoint de crear préstamo de equipo',
            );
            const prestamo = await this.createEquipmentLoanUseCase.execute(
                request.body,
            );
            return reply.status(201).send({ data: prestamo });
        } catch (error: any) {
            if (
                error.message.includes('cadete') ||
                error.message.includes('inválido')
            ) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('id')) {
                return reply.status(404).send({ error: error.message });
            }
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error al crear el préstamo de equipo' });
        }
    }
}
