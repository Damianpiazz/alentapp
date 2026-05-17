import { PrismaPg } from '@prisma/adapter-pg';
import {
    PrismaClient,
    LockerLocation,
    LockerStatus,
    Locker,
} from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO } from '@alentapp/shared';

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

                status: LockerStatus.DISPONIBLE,

                member_id: null,

                contract_start_date: null,

                contract_finish_date: null,
            },
        });

        return this.mapToDTO(created);
    }

    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { id },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findByNumber(number: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { number },
        });

        return locker ? this.mapToDTO(locker) : null;
    }

    async findAll(): Promise<LockerDTO[]> {
        const lockers = await prisma.locker.findMany({
            orderBy: {
                contract_start_date: 'desc',
            },
        });

        return lockers.map((locker: Locker) => this.mapToDTO(locker));
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

            contract_start_date: locker.contract_start_date
                ? locker.contract_start_date.toISOString()
                : null,
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
        if (status === 'Ocupado') {
            return LockerStatus.OCUPADO;
        }

        if (status === 'Mantenimiento') {
            return LockerStatus.MANTENIMIENTO;
        }

        return LockerStatus.DISPONIBLE;
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
