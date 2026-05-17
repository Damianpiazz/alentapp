import { LockerRepository } from '../domain/LockerRepository.js';

export class GetLockersUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute() {
        return this.lockerRepository.findAll();
    }
}
