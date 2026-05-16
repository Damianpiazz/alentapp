// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
    id: string; // UUID
    dni: string;
    name: string;
    email: string;
    birthdate: string; // ISO Date String (YYYY-MM-DD)
    category: MemberCategory;
    status: MemberStatus;
    created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
    dni: string;
    name: string;
    email: string;
    birthdate: string; // ISO Date String (YYYY-MM-DD)
    category: MemberCategory;
}

export interface UpdateMemberRequest {
    dni?: string;
    name?: string;
    email?: string;
    birthdate?: string; // ISO Date String (YYYY-MM-DD)
    category?: MemberCategory;
    status?: MemberStatus;
}

// ==========================================
// Locker
// ==========================================

export type LockerLocation =
    | 'Vestuario Masculino'
    | 'Vestuario Femenino'
    | 'Niños';

export type LockerStatus = 'Disponible' | 'Ocupado' | 'Mantenimiento';

export interface LockerDTO {
    id: string;

    number: string;

    location: LockerLocation;

    status: LockerStatus;

    member_id?: string | null;

    contract_finish_date?: string | null;

    contract_start_date: string | null;
}

export interface CreateLockerRequest {
    number: string;

    location: LockerLocation;
}

export type UpdateLockerRequest = {
    number?: string;

    location?: 'Vestuario Masculino' | 'Vestuario Femenino' | 'Niños';

    status?: 'Disponible' | 'Ocupado' | 'Mantenimiento';

    member_id?: string | null;

    contract_finish_date?: string | null;

    contract_start_date?: string | null;
};
