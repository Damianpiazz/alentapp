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
// Payment
// ==========================================
export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue' | 'Canceled';

export interface PaymentDTO {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: PaymentStatus;
    due_date: string; // ISO Date String (YYYY-MM-DD)
    payment_date: string | null; // ISO Date String (YYYY-MM-DD)
    deleted_at: string | null; // ISO Date String (YYYY-MM-DD)
    member_id: string;
}

export interface CreatePaymentRequest {
    amount: number;
    month: number;
    year: number;
    due_date: string; // ISO Date String (YYYY-MM-DD)
    member_id: string;
}

export interface UpdatePaymentRequest {
    amount?: number;
    status?: PaymentStatus;
    payment_date?: string | null; // ISO Date String (YYYY-MM-DD)
}

// ===========================================
// Discipline
// ==========================================

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
