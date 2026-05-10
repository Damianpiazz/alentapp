import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        // 1. Validaciones de negocio
        this.sportValidator.validateName(data.name);
        this.sportValidator.validateDescription(data.description);
        this.sportValidator.validateMaxCapacity(data.max_capacity);
        this.sportValidator.validateAdditionalPrice(data.additional_price);

        // 2. Normalización
        const normalizedName = this.sportValidator.normalizeName(data.name);

        const normalizedDescription = this.sportValidator.normalizeDescription(
            data.description,
        );

        // 3. Validación de unicidad
        await this.sportValidator.validateNameIsUnique(normalizedName);

        // 4. Persistencia
        const newSport = await this.sportRepository.create({
            ...data,
            name: normalizedName,
            description: normalizedDescription,
            created_at: new Date().toISOString(),
        });

        return newSport;
    }
}
