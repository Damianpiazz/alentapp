import { SportDTO, UpdateSportRequest } from '@alentapp/shared';
export interface SportRepository {
    create(sport: Omit<SportDTO, 'id'>): Promise<SportDTO>;
    findById(id: string): Promise<SportDTO | null>;
    findByName(name: string): Promise<SportDTO | null>;
    findAll(): Promise<SportDTO[]>;
    update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
    delete(id: string): Promise<void>;
}
