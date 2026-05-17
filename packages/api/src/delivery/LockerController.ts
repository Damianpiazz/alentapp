import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';

import { GetLockersUseCase } from '../application/GetLockersUseCase.js';

import { CreateLockerRequest } from '@alentapp/shared';

import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';

import { UpdateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,

        private readonly getLockersUseCase: GetLockersUseCase,

        private readonly updateLockerUseCase: UpdateLockerUseCase,
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
        } catch (error) {
            const err = error as Error;

            return rep.status(500).send({
                error: err.message || 'Error al obtener lockers',
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
        } catch (error) {
            const err = error as Error;

            return rep.status(400).send({
                error: err.message,
            });
        }
    }

    async update(
        req: FastifyRequest<{
            Params: {
                id: string;
            };

            Body: UpdateLockerRequest;
        }>,

        rep: FastifyReply,
    ) {
        try {
            const locker = await this.updateLockerUseCase.execute(
                req.params.id,
                req.body,
            );

            return rep.send({
                data: locker,
            });
        } catch (error) {
            const err = error as Error;

            console.log('ERROR UPDATE LOCKER:', err);

            if (err.message === 'El locker no existe') {
                return rep.status(404).send({
                    error: err.message,
                });
            }

            if (err.message === 'El socio no existe') {
                return rep.status(404).send({
                    error: err.message,
                });
            }

            if (err.message === 'Ya existe un locker con ese número') {
                return rep.status(409).send({
                    error: err.message,
                });
            }

            if (err.message === 'El locker no se encuentra disponible') {
                return rep.status(409).send({
                    error: err.message,
                });
            }

            if (
                err.message ===
                'La fecha debe ser igual o posterior a la fecha actual'
            ) {
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'Debe ingresar una fecha de vencimiento') {
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'No se puede asignar fecha sin socio') {
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'El DNI debe tener 8 dígitos') {
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'Debe asignar un socio al locker') {
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'Ingrese un DNI correcto') {
                return rep.status(400).send({
                    error: err.message,
                });
            }

            return rep.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
}
