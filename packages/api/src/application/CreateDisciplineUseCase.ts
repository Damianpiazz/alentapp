import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export class CreateDisciplineUseCase {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        // 1. Validar campos requeridos
        if (!data.reason || !data.start_date || !data.end_date) {
            throw new Error(
                'Los campos reason, start_date y end_date son obligatorios',
            );
        }

        // 2. Parsear fechas
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        // 3. Validar que end_date sea estrictamente posterior a start_date
        if (endDate <= startDate) {
            throw new Error(
                'La fecha de fin debe ser posterior a la de inicio',
            );
        }

        // 4. Verificar que el socio exista
        const memberExists = await this.disciplineRepository.existsMember(
            data.member_id,
        );
        if (!memberExists) {
            throw new Error('El socio indicado no existe');
        }

        // 5. Persistir a través del repositorio
        return await this.disciplineRepository.create(data);
    }
}
