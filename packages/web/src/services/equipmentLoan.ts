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

    async getAll(): Promise<EquipmentLoanDTO[]> {
        const response = await fetch(`${API_URL}/prestamos`);
        if (!response.ok) {
            throw new Error('Error al obtener los préstamos');
        }
        const result = await response.json();
        return result.data;
    },

    async update(id: string, status: string): Promise<EquipmentLoanDTO> {
        const response = await fetch(`${API_URL}/prestamos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error || 'Error al actualizar el préstamo',
            );
        }
        const result = await response.json();
        return result.data;
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/prestamos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar el préstamo');
        }
    },
};
