import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string): Promise<void> {
        const locker = await this.lockerRepository.findById(id);

        if (!locker) {
            throw new Error('El locker no existe');
        }

        if (locker.status === 'Disponible') {
            throw new Error('El locker ya se encuentra disponible');
        }

        await this.lockerRepository.delete(id);
    }
}
