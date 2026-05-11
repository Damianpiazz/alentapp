import { DisciplineRepository } from '../DisciplineRepository.js';
import { ValidationError, NotFoundError } from '../errors.js';

export class DisciplineValidator {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    validateRequiredFields(data: {
        member_id: string;
        reason: string;
        start_date: string;
        end_date: string;
    }) {
        if (
            !data.member_id ||
            !data.reason ||
            !data.start_date ||
            !data.end_date
        ) {
            throw new ValidationError(
                'Los campos member_id, reason, start_date y end_date son obligatorios',
            );
        }
    }

    validateDates(start_date: string, end_date: string) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new ValidationError(
                'Formato de fecha inválido, use YYYY-MM-DD',
            );
        }

        if (endDate <= startDate) {
            throw new ValidationError(
                'La fecha de fin debe ser posterior a la de inicio',
            );
        }
    }

    async validateMemberExists(member_id: string) {
        const memberExists =
            await this.disciplineRepository.existsMember(member_id);

        if (!memberExists) {
            throw new NotFoundError('El socio indicado no existe');
        }
    }

    async validateDisciplineExists(id: string) {
        const existing = await this.disciplineRepository.findById(id);

        if (!existing) {
            throw new NotFoundError('La sanción no existe');
        }

        return existing;
    }
}
