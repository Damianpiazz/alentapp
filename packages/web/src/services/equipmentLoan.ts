import type {
    EquipmentLoanDTO,
    CreateEquipmentLoanRequest,
} from '@alentapp/shared';

const API_URL =
    (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const equipmentLoanService = {
    async create(data: CreateEquipmentLoanRequest): Promise<EquipmentLoanDTO> {
        const response = await fetch(`${API_URL}/prestamos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear el préstamo');
        }
        const result = await response.json();
        return result;
    },
};
