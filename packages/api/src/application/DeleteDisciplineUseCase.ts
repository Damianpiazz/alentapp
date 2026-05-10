import { DisciplineRepository } from '../domain/DisciplineRepository.js';

export class DeleteDisciplineUseCase {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    async execute(id: string): Promise<void> {
        // 1. Verificar que la sanción existe
        const existing = await this.disciplineRepository.findById(id);
        if (!existing) {
            throw new Error('La sanción no existe');
        }

        // 2. Eliminar
        await this.disciplineRepository.delete(id);
    }
}
