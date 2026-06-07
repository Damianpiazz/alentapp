import { FastifyRequest, FastifyReply } from 'fastify';
import { NewEquipmentLoanUseCase } from '../application/NewEquipmentLoanUseCase.js';
import { CreateEquipmentLoanRequest } from '@alentapp/shared';
import { GetEquipmentLoanUseCase } from '../application/GetEquipmentLoanUseCase.js';
import { UpdateEquipmentLoanUseCase } from '../application/UpdateEquipmentLoanUseCase.js';
import { DeleteEquipmentLoanUseCase } from '../application/DeleteEquipmentLoanUseCase.js';

export class EquipmentLoanController {
    constructor(
        private readonly createEquipmentLoanUseCase: NewEquipmentLoanUseCase,
        private readonly getEquipmentLoanUseCase: GetEquipmentLoanUseCase,
        private readonly updateEquipmentLoanUseCase: UpdateEquipmentLoanUseCase,
        private readonly deleteEquipmentLoanUseCase: DeleteEquipmentLoanUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const prestamos = await this.getEquipmentLoanUseCase.execute();
            return reply.status(200).send({ data: prestamos });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

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
                error.message.includes('Cadete') ||
                error.message.includes('inválido') ||
                error.message.includes('fecha de devolución')
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

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: { status: string };
        }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const { status } = request.body;

            const updatedLoan = await this.updateEquipmentLoanUseCase.execute(
                id,
                status,
            );
            return reply.status(200).send({ data: updatedLoan });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('Loaned')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('devuelto')) {
                return reply.status(400).send({ error: error.message });
            }
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error al actualizar el préstamo de equipo' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteEquipmentLoanUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            request.log.error(error);
            return reply
                .status(500)
                .send({ error: 'Error al eliminar el préstamo de equipo' });
        }
    }
}
