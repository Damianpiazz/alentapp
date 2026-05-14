import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';

import { GetLockersUseCase } from '../application/GetLockersUseCase.js';

import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,

        private readonly getLockersUseCase: GetLockersUseCase,
    ) {}

    async getAll(
        req: FastifyRequest,

        rep: FastifyReply,
    ) {
        try {
            const lockers = await this.getLockersUseCase.execute();

            return rep.send({
                data: lockers,
            });
        } catch (error: any) {
            return rep.status(500).send({
                error: 'Error al obtener lockers',
            });
        }
    }

    async create(
        req: FastifyRequest<{
            Body: CreateLockerRequest;
        }>,

        rep: FastifyReply,
    ) {
        try {
            const locker = await this.createLockerUseCase.execute(req.body);

            return rep.status(201).send({
                data: locker,
            });
        } catch (error: any) {
            return rep.status(400).send({
                error: error.message,
            });
        }
    }
}
