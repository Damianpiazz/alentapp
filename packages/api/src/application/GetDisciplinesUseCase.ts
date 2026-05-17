import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

export class GetDisciplinesUseCase {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    async execute(): Promise<DisciplineDTO[]> {
        return await this.disciplineRepository.findAll();
    }
}
