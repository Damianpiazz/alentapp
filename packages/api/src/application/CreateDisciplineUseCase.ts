import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

export class CreateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
    ) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        // 1. Validaciones
        this.disciplineValidator.validateRequiredFields(data);

        this.disciplineValidator.validateDates(data.start_date, data.end_date);

        await this.disciplineValidator.validateMemberExists(data.member_id);

        // 2. Persistir a través de la interfaz
        return await this.disciplineRepository.create(data);
    }
}
