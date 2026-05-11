import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

export class DeleteDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
    ) {}

    async execute(id: string): Promise<void> {
        // 1. Verificar que la sanción existe
        await this.disciplineValidator.validateDisciplineExists(id);

        // 2. Eliminar
        await this.disciplineRepository.delete(id);
    }
}
