import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

export class UpdateDisciplineUseCase {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    async execute(
        id: string,
        data: UpdateDisciplineRequest,
    ): Promise<DisciplineDTO> {
        // 1. Verificar que la sanción existe
        const existing = await this.disciplineRepository.findById(id);
        if (!existing) {
            throw new Error('La sanción no existe');
        }

        // 2. Validar fechas si vienen en el request
        const startDate = new Date(data.start_date || existing.start_date);
        const endDate = new Date(data.end_date || existing.end_date);

        if (endDate <= startDate) {
            throw new Error(
                'La fecha de fin debe ser posterior a la de inicio',
            );
        }

        // 3. Persistir cambios
        return await this.disciplineRepository.update(id, data);
    }
}
