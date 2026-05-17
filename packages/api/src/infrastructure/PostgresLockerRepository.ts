import { PrismaPg } from '@prisma/adapter-pg';

import {
    PrismaClient,
    LockerLocation,
    LockerStatus,
    Locker,
} from '../generated/client/client.js';

import { LockerRepository } from '../domain/LockerRepository.js';

import { UpdateLockerRequest, LockerDTO } from '@alentapp/shared';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
});

export class PostgresLockerRepository implements LockerRepository {
    async create(locker: Omit<LockerDTO, 'id'>): Promise<LockerDTO> {
        const created = await prisma.locker.create({
            data: {
                number: locker.number,

                location: this.mapLocation(locker.location),

                status: this.mapStatus(locker.status),

                member_id: locker.member_id,

                contract_finish_date: locker.contract_finish_date
                    ? new Date(locker.contract_finish_date)
                    : null,

                contract_start_date: locker.contract_start_date
                    ? new Date(locker.contract_start_date)
                    : null,
            },
        });

        return this.mapToDTO(created);
    }

    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: {
                id,
            },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findByNumber(number: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: {
                number,
            },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findAll(): Promise<LockerDTO[]> {
        const lockers = await prisma.locker.findMany({
            include: {
                member: true,
            },
        });

        return lockers.map((locker: Locker) => this.mapToDTO(locker));
    }

    async update(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        const updated = await prisma.locker.update({
            where: {
                id,
            },

            data: {
                ...(data.number && {
                    number: data.number,
                }),

                ...(data.location && {
                    location: this.mapLocation(data.location),
                }),

                ...(data.status && {
                    status: this.mapStatus(data.status),
                }),

                ...(data.member_id !== undefined && {
                    member_id: data.member_id,
                }),

                ...(data.contract_start_date !== undefined && {
                    contract_start_date: data.contract_start_date
                        ? new Date(data.contract_start_date)
                        : null,
                }),

                ...(data.contract_finish_date !== undefined && {
                    contract_finish_date: data.contract_finish_date
                        ? new Date(data.contract_finish_date)
                        : null,
                }),
            },
        });

        return this.mapToDTO(updated);
    }

    private mapToDTO(locker: Locker): LockerDTO {
        return {
            id: locker.id,

            number: locker.number,

            location: this.unmapLocation(locker.location),

            status: this.unmapStatus(locker.status),

            member_id: locker.member_id,

            contract_finish_date:
                locker.contract_finish_date?.toISOString() ?? null,

            contract_start_date:
                locker.contract_start_date?.toISOString() ?? null,
        };
    }

    private mapLocation(location?: string): LockerLocation {
        if (location === 'Vestuario Masculino') {
            return LockerLocation.VESTUARIO_MASCULINO;
        }

        if (location === 'Vestuario Femenino') {
            return LockerLocation.VESTUARIO_FEMENINO;
        }

        return LockerLocation.NINOS;
    }

    private unmapLocation(
        location: LockerLocation,
    ): 'Vestuario Masculino' | 'Vestuario Femenino' | 'Niños' {
        if (location === LockerLocation.VESTUARIO_MASCULINO) {
            return 'Vestuario Masculino';
        }

        if (location === LockerLocation.VESTUARIO_FEMENINO) {
            return 'Vestuario Femenino';
        }

        return 'Niños';
    }

    private mapStatus(status?: string): LockerStatus {
        if (status === 'Disponible') {
            return LockerStatus.DISPONIBLE;
        }

        if (status === 'Ocupado') {
            return LockerStatus.OCUPADO;
        }

        return LockerStatus.MANTENIMIENTO;
    }

    private unmapStatus(
        status: LockerStatus,
    ): 'Disponible' | 'Ocupado' | 'Mantenimiento' {
        if (status === LockerStatus.DISPONIBLE) {
            return 'Disponible';
        }

        if (status === LockerStatus.OCUPADO) {
            return 'Ocupado';
        }

        return 'Mantenimiento';
    }
}
