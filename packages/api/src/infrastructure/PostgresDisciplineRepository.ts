import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import {
    DisciplineDTO,
    CreateDisciplineRequest,
    UpdateDisciplineRequest,
} from '@alentapp/shared';
import { NotFoundError } from '../domain/errors.js';

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!),
});

type DBDiscipline = {
    id: string;
    member_id: string;
    reason: string;
    start_date: Date;
    end_date: Date;
    is_total_suspension: boolean;
    created_at: Date;
};

export class PostgresDisciplineRepository implements DisciplineRepository {
    async findAll(): Promise<DisciplineDTO[]> {
        const disciplines = await prisma.discipline.findMany({
            orderBy: { created_at: 'desc' },
        });
        return disciplines.map(this.mapToDTO);
    }
    async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.create({
            data: {
                member_id: data.member_id,
                reason: data.reason,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                is_total_suspension: data.is_total_suspension,
            },
        });

        return this.mapToDTO(discipline);
    }

    async findById(id: string): Promise<DisciplineDTO | null> {
        const discipline = await prisma.discipline.findUnique({
            where: { id },
        });
        return discipline ? this.mapToDTO(discipline) : null;
    }

    async update(
        id: string,
        data: UpdateDisciplineRequest,
    ): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.update({
            where: { id },
            data: {
                ...(data.reason && { reason: data.reason }),
                ...(data.start_date && {
                    start_date: new Date(data.start_date),
                }),
                ...(data.end_date && { end_date: new Date(data.end_date) }),
                ...(data.is_total_suspension !== undefined && {
                    is_total_suspension: data.is_total_suspension,
                }),
            },
        });
        return this.mapToDTO(discipline);
    }

    async delete(id: string): Promise<void> {
        try {
            await prisma.discipline.delete({
                where: { id },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundError('La sanción indicada no existe');
            }
            throw error;
        }
    }

    async existsMember(memberId: string): Promise<boolean> {
        const member = await prisma.member.findUnique({
            where: { id: memberId },
        });
        return member !== null;
    }

    private mapToDTO(discipline: DBDiscipline): DisciplineDTO {
        return {
            id: discipline.id,
            member_id: discipline.member_id,
            reason: discipline.reason,
            start_date: discipline.start_date.toISOString().split('T')[0],
            end_date: discipline.end_date.toISOString().split('T')[0],
            is_total_suspension: discipline.is_total_suspension,
            created_at: discipline.created_at.toISOString(),
        };
    }
}
