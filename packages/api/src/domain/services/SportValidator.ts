import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    private static readonly MAX_NAME_LENGTH = 100;
    private static readonly MAX_DESCRIPTION_LENGTH = 500;

    constructor(private readonly sportRepo: SportRepository) {}

    async validateNameIsUnique(
        name: string,
        excludeSportId?: string,
    ): Promise<void> {
        const existingSport = await this.sportRepo.findByName(name);

        if (existingSport && existingSport.id !== excludeSportId) {
            throw new Error('Ya existe un deporte con ese nombre');
        }
    }

    validateName(name: string): void {
        if (name === undefined || name === null) {
            throw new Error('El nombre del deporte es obligatorio');
        }

        if (typeof name !== 'string') {
            throw new Error('El nombre del deporte es inválido');
        }

        const trimmedName = name.trim();

        if (trimmedName.length === 0) {
            throw new Error('El nombre del deporte es inválido');
        }

        if (trimmedName.length > SportValidator.MAX_NAME_LENGTH) {
            throw new Error('El nombre excede el máximo permitido');
        }
    }

    validateDescription(description: string): void {
        if (description === undefined || description === null) {
            throw new Error('La descripción es obligatoria');
        }

        if (typeof description !== 'string') {
            throw new Error('La descripción es obligatoria');
        }

        const trimmedDescription = description.trim();

        if (trimmedDescription.length === 0) {
            throw new Error('La descripción es obligatoria');
        }

        if (trimmedDescription.length > SportValidator.MAX_DESCRIPTION_LENGTH) {
            throw new Error('La descripción excede el máximo permitido');
        }
    }

    validateMaxCapacity(maxCapacity: number): void {
        if (maxCapacity === undefined || maxCapacity === null) {
            throw new Error('La capacidad máxima es obligatoria');
        }

        if (typeof maxCapacity !== 'number' || Number.isNaN(maxCapacity)) {
            throw new Error('La capacidad máxima debe ser numérica');
        }

        if (maxCapacity <= 0) {
            throw new Error('La capacidad máxima debe ser mayor a cero');
        }
    }

    validateAdditionalPrice(additionalPrice: number): void {
        if (
            typeof additionalPrice !== 'number' ||
            Number.isNaN(additionalPrice)
        ) {
            throw new Error('El precio adicional debe ser numérico');
        }

        if (additionalPrice < 0) {
            throw new Error('El precio adicional no puede ser negativo');
        }
    }

    normalizeName(name: string): string {
        return name.trim();
    }

    normalizeDescription(description: string): string {
        return description.trim();
    }
}
