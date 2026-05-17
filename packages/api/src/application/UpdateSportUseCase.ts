import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}
    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const existingSport = await this.sportRepo.findById(id);
        if (!existingSport) {
            throw new Error('El deporte solicitado no existe');
        }
        if (data.max_capacity !== undefined) {
            this.sportValidator.validateMaxCapacity(data.max_capacity);
        }
        const normalizedDescription =
            data.description !== undefined
                ? this.sportValidator.normalizeDescription(data.description)
                : undefined;
        return this.sportRepo.update(id, {
            ...data,
            ...(normalizedDescription !== undefined && {
                description: normalizedDescription,
            }),
        });
    }
}
