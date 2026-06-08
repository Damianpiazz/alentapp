import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';

import { GetLockersUseCase } from '../application/GetLockersUseCase.js';

import { CreateLockerRequest } from '@alentapp/shared';

import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';

import { UpdateLockerRequest } from '@alentapp/shared';

import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';

import { createREDMetrics, meter } from '../infrastructure/telemetry.js';

const { requestCounter, errorCounter, requestDuration, activeRequests } =
    createREDMetrics(meter);

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,

        private readonly getLockersUseCase: GetLockersUseCase,

        private readonly updateLockerUseCase: UpdateLockerUseCase,

        private readonly deleteLockerUseCase: DeleteLockerUseCase,
    ) {}

    async getAll(
        req: FastifyRequest,

        rep: FastifyReply,
    ) {
        const start = Date.now();
        const method = req.method;
        const route = req.url.split('?')[0];
        try {
            const lockers = await this.getLockersUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return rep.send({
                data: lockers,
            });
        } catch (error) {
            const err = error as Error;
            errorCounter.add(1, { method, route, status: '500' });
            return rep.status(500).send({
                error: err.message || 'Error al obtener lockers',
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async create(
        req: FastifyRequest<{
            Body: CreateLockerRequest;
        }>,

        rep: FastifyReply,
    ) {
        const start = Date.now();
        const method = req.method;
        const route = req.url.split('?')[0];
        try {
            const locker = await this.createLockerUseCase.execute(req.body);
            requestCounter.add(1, { method, route, status: '201' });
            return rep.status(201).send({
                data: locker,
            });
        } catch (error) {
            const err = error as Error;
            errorCounter.add(1, { method, route, status: '400' });
            return rep.status(400).send({
                error: err.message,
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
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
        const start = Date.now();
        const method = req.method;
        const route = req.url.split('?')[0];
        try {
            const locker = await this.updateLockerUseCase.execute(
                req.params.id,
                req.body,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return rep.send({
                data: locker,
            });
        } catch (error) {
            const err = error as Error;

            console.log('ERROR UPDATE LOCKER:', err);

            if (err.message === 'El locker no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return rep.status(404).send({
                    error: err.message,
                });
            }

            if (err.message === 'El socio no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return rep.status(404).send({
                    error: err.message,
                });
            }

            if (err.message === 'Ya existe un locker con ese número') {
                errorCounter.add(1, { method, route, status: '409' });
                return rep.status(409).send({
                    error: err.message,
                });
            }

            if (err.message === 'El locker no se encuentra disponible') {
                errorCounter.add(1, { method, route, status: '409' });
                return rep.status(409).send({
                    error: err.message,
                });
            }

            if (
                err.message ===
                'La fecha debe ser igual o posterior a la fecha actual'
            ) {
                errorCounter.add(1, { method, route, status: '400' });
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'Debe ingresar una fecha de vencimiento') {
                errorCounter.add(1, { method, route, status: '400' });
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'No se puede asignar fecha sin socio') {
                errorCounter.add(1, { method, route, status: '400' });
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'El DNI debe tener 8 dígitos') {
                errorCounter.add(1, { method, route, status: '400' });
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'Debe asignar un socio al locker') {
                errorCounter.add(1, { method, route, status: '400' });
                return rep.status(400).send({
                    error: err.message,
                });
            }

            if (err.message === 'Ingrese un DNI correcto') {
                errorCounter.add(1, { method, route, status: '400' });
                return rep.status(400).send({
                    error: err.message,
                });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return rep.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async delete(
        req: FastifyRequest<{
            Params: {
                id: string;
            };
        }>,

        rep: FastifyReply,
    ) {
        const start = Date.now();
        const method = req.method;
        const route = req.url.split('?')[0];
        try {
            await this.deleteLockerUseCase.execute(req.params.id);
            requestCounter.add(1, { method, route, status: '204' });
            return rep.status(204).send();
        } catch (error) {
            const err = error as Error;

            if (err.message === 'El locker no existe') {
                errorCounter.add(1, { method, route, status: '404' });
                return rep.status(404).send({
                    error: err.message,
                });
            }

            if (err.message === 'El locker ya se encuentra disponible') {
                errorCounter.add(1, { method, route, status: '409' });
                return rep.status(409).send({
                    error: err.message,
                });
            }
            errorCounter.add(1, { method, route, status: '500' });
            return rep.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }
}
