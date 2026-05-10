import { SportDTO } from '@alentapp/shared';

export interface SportRepository {
    create(sport: Omit<SportDTO, 'id'>): Promise<SportDTO>;
    findById(id: string): Promise<SportDTO | null>;
    findByName(name: string): Promise<SportDTO | null>;
    findAll(): Promise<SportDTO[]>;
}
