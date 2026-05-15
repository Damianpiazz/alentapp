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

export interface SportDTO {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
    created_at: string;
    deleted_at: string | null;
}
export interface CreateSportRequest {
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
export interface UpdateSportRequest {
    description?: string;
    max_capacity?: number;
    additional_price?: number;
    requires_medical_certificate?: boolean;
    // ===========================================
    // Discipline
    // ==========================================
}

export interface DisciplineDTO {
    id: string;
    member_id: string;
    reason: string;
    start_date: string; // ISO Date String (YYYY-MM-DD)
    end_date: string; // ISO Date String (YYYY-MM-DD)
    is_total_suspension: boolean;
    created_at: string; // ISO Date String
}

export interface CreateDisciplineRequest {
    member_id: string;
    reason: string;
    start_date: string; // ISO Date String (YYYY-MM-DD)
    end_date: string; // ISO Date String (YYYY-MM-DD)
    is_total_suspension: boolean;
}

export interface UpdateDisciplineRequest {
    reason?: string;
    start_date?: string;
    end_date?: string;
    is_total_suspension?: boolean;
}
