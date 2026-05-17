import {
    DisciplineDTO,
    CreateDisciplineRequest,
    UpdateDisciplineRequest,
} from '@alentapp/shared';

export interface DisciplineRepository {
    create(discipline: CreateDisciplineRequest): Promise<DisciplineDTO>;
    findAll(): Promise<DisciplineDTO[]>;
    findById(id: string): Promise<DisciplineDTO | null>;
    update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO>;
    delete(id: string): Promise<void>;
    existsMember(memberId: string): Promise<boolean>;
}
