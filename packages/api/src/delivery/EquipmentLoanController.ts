import { FastifyRequest, FastifyReply } from 'fastify';
import { NewEquipmentLoanUseCase } from '../application/NewEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';

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
            const payload = {
                ...request.body,
                due_date: new Date(request.body.due_date as any),
            };
            const prestamo =
                await this.createEquipmentLoanUseCase.execute(payload);
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
