import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
    ) {}

    async execute(
        id: string,
        data: UpdateDisciplineRequest,
    ): Promise<DisciplineDTO> {
        // 1. Validar que se envíe al menos un campo para actualizar
        if (Object.keys(data).length === 0) {
            throw new Error('Debe enviarse al menos un campo para actualizar');
        }

        // 2. Validaciones
        // Existencia
        const existing =
            await this.disciplineValidator.validateDisciplineExists(id);

        // Fechas
        this.disciplineValidator.validateDates(
            data.start_date || existing.start_date,
            data.end_date || existing.end_date,
        );

        // 3. Persistir cambios
        return await this.disciplineRepository.update(id, data);
    }
}
