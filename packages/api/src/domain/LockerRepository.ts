import { LockerDTO } from '@alentapp/shared';

export interface LockerRepository {
    create(locker: Omit<LockerDTO, 'id'>): Promise<LockerDTO>;

    findById(id: string): Promise<LockerDTO | null>;

    findByNumber(number: string): Promise<LockerDTO | null>;

    findAll(): Promise<LockerDTO[]>;
}
