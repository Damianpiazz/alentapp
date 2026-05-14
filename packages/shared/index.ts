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
// EquipmentLoan
// ==========================================

export type EquipmentLoanStatus = 'Loaned' | 'Returned' | 'Demaged';

export interface EquipmentLoanDTO {
    id: string; // UUID
    item_name: string;
    status: EquipmentLoanStatus;
    loan_date: Date;
    due_date: Date;
    member_id: string; // UUID
}

export interface CreateEquipmentLoanRequest {
    item_name: string;
    due_date: Date;
    member_id: string; // UUID
}
