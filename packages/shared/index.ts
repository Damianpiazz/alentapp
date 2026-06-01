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

    member_dni?: string | null;

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
// EquipmentLoan
// ==========================================

export type EquipmentLoanStatus = 'Loaned' | 'Returned' | 'Damaged';

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
