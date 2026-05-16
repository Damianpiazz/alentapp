import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerValidator } from '../domain/services/LockerValidator.js';
import { LockerDTO, UpdateLockerRequest } from '@alentapp/shared';
import { MemberRepository } from '../domain/MemberRepository.js';

export class UpdateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,

        private readonly lockerValidator: LockerValidator,

        private readonly memberRepository: MemberRepository,
    ) {}

    async execute(
        id: string,

        data: UpdateLockerRequest,
    ): Promise<LockerDTO> {
        const existing = await this.lockerRepository.findById(id);

        if (!existing) {
            throw new Error('El locker no existe');
        }

        if (data.number) {
            await this.lockerValidator.validateNumberIsUnique(data.number, id);
        }

        if (data.contract_finish_date) {
            const parts = data.contract_finish_date.split('/');

            if (parts.length === 3) {
                const [day, month, year] = parts;

                data.contract_finish_date = `${year}-${month}-${day}`;
            }
        }

        this.lockerValidator.validateContractDate(data.contract_finish_date);
        this.lockerValidator.validateOccupiedLocker(
            data.member_id,
            data.contract_finish_date,
        );

        this.lockerValidator.validateContractWithoutMember(
            data.member_id,
            data.contract_finish_date,
        );

        this.lockerValidator.validateMemberDni(data.member_id);

        this.lockerValidator.validateOccupiedStatus(
            data.status,
            data.member_id,
        );

        if (data.member_id) {
            const member = await this.memberRepository.findByDni(
                data.member_id,
            );

            if (!member) {
                throw new Error('El socio no existe');
            }

            data.member_id = member.id;
        }

        if (data.member_id) {
            data.status = 'Ocupado';
        }

        if (data.member_id === null && data.status !== 'Mantenimiento') {
            data.status = 'Disponible';

            data.contract_start_date = null;

            data.contract_finish_date = null;
        }

        const nextStatus = data.status ?? existing.status;

        if (nextStatus === 'Mantenimiento' && existing.member_id) {
            throw new Error('El locker no se encuentra disponible');
        }

        if (existing.status === 'Ocupado' && nextStatus === 'Mantenimiento') {
            throw new Error('El locker no se encuentra disponible');
        }

        return await this.lockerRepository.update(id, data);
    }
}
