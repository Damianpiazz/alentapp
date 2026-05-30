import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportsView } from './Sports';
import { sportsService } from '../services/sports';
import { Provider } from '../components/ui/provider';
import type { SportDTO } from '@alentapp/shared';
// Mockeamos el servicio que hace el fetch real para aislar el componente
vi.mock('../services/sports', () => ({
    sportsService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));
describe('SportsView', () => {
    const renderWithProviders = (ui: React.ReactElement) => {
        return render(<Provider>{ui}</Provider>);
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('debe mostrar el estado de carga y luego renderizar una tabla vacía', async () => {
        vi.mocked(sportsService.getAll).mockResolvedValueOnce([]);
        renderWithProviders(<SportsView />);
        expect(screen.getByText('Cargando deportes...')).toBeInTheDocument();
        await waitFor(() => {
            expect(
                screen.queryByText('Cargando deportes...'),
            ).not.toBeInTheDocument();
        });
        expect(
            screen.getByText('No se encontraron deportes.'),
        ).toBeInTheDocument();
    });
    it('debe renderizar la lista de deportes si el backend responde exitosamente', async () => {
        const mockSports = [
            {
                id: '1',
                name: 'Fútbol',
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
                created_at: new Date().toISOString(),
                deleted_at: null,
            },
            {
                id: '2',
                name: 'Natación',
                description: 'Deporte acuático',
                max_capacity: 30,
                additional_price: 15,
                requires_medical_certificate: true,
                created_at: new Date().toISOString(),
                deleted_at: null,
            },
        ] as SportDTO[];
        vi.mocked(sportsService.getAll).mockResolvedValueOnce(mockSports);
        renderWithProviders(<SportsView />);
        await waitFor(() => {
            expect(screen.getByText('Fútbol')).toBeInTheDocument();
        });
        expect(screen.getByText('Deporte en equipo')).toBeInTheDocument();
        expect(screen.getByText('Natación')).toBeInTheDocument();
        expect(screen.getByText('Deporte acuático')).toBeInTheDocument();
    });
    it('debe renderizar un mensaje de error si el servicio backend falla', async () => {
        vi.mocked(sportsService.getAll).mockRejectedValueOnce(
            new Error('Error al cargar los deportes'),
        );
        renderWithProviders(<SportsView />);
        await waitFor(() => {
            expect(
                screen.getByText('Error al cargar los deportes'),
            ).toBeInTheDocument();
        });
    });
    it('debe permitir crear un nuevo deporte mediante el formulario', async () => {
        const user = (
            await import('@testing-library/user-event')
        ).default.setup();
        vi.mocked(sportsService.getAll).mockResolvedValue([]);
        vi.mocked(sportsService.create).mockResolvedValueOnce({
            id: '3',
            name: 'Basket',
            description: 'Deporte de canasta',
            max_capacity: 10,
            additional_price: 0,
            requires_medical_certificate: false,
            created_at: new Date().toISOString(),
            deleted_at: null,
        });
        renderWithProviders(<SportsView />);
        await waitFor(() => {
            expect(
                screen.queryByText('Cargando deportes...'),
            ).not.toBeInTheDocument();
        });
        const addButton = screen.getByText(/Agregar Deporte/i);
        await user.click(addButton);
        await user.type(screen.getByPlaceholderText('Ej. Fútbol'), 'Basket');
        await user.type(
            screen.getByPlaceholderText(
                'Ej. Deporte colectivo de 11 jugadores',
            ),
            'Deporte de canasta',
        );
        const submitButton = screen.getByText('Crear Deporte');
        await user.click(submitButton);
        expect(sportsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Basket',
                description: 'Deporte de canasta',
            }),
        );
    });
    it('debe permitir eliminar un deporte con confirmación', async () => {
        const user = (
            await import('@testing-library/user-event')
        ).default.setup();
        const mockSports = [
            {
                id: '1',
                name: 'Fútbol',
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
                created_at: new Date().toISOString(),
                deleted_at: null,
            },
        ] as SportDTO[];
        vi.mocked(sportsService.getAll).mockResolvedValue(mockSports);
        vi.mocked(sportsService.delete).mockResolvedValueOnce(undefined);
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        renderWithProviders(<SportsView />);
        await waitFor(() => {
            expect(screen.getByText('Fútbol')).toBeInTheDocument();
        });
        const deleteButton = screen.getByLabelText(/Eliminar deporte/i);
        await user.click(deleteButton);
        expect(confirmSpy).toHaveBeenCalledWith(
            '¿Estás seguro de que deseas eliminar el deporte "Fútbol"? Esta acción no se puede deshacer.',
        );
        expect(sportsService.delete).toHaveBeenCalledWith('1');
        confirmSpy.mockRestore();
    });
    it('debe permitir editar un deporte existente', async () => {
        const user = (
            await import('@testing-library/user-event')
        ).default.setup();
        const mockSports = [
            {
                id: '1',
                name: 'Fútbol',
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
                created_at: new Date().toISOString(),
                deleted_at: null,
            },
        ] as SportDTO[];
        vi.mocked(sportsService.getAll).mockResolvedValue(mockSports);
        vi.mocked(sportsService.update).mockResolvedValueOnce({
            ...mockSports[0],
            max_capacity: 30,
        });
        renderWithProviders(<SportsView />);
        await waitFor(() => {
            expect(screen.getByText('Fútbol')).toBeInTheDocument();
        });
        const editButton = screen.getByLabelText(/Editar deporte/i);
        await user.click(editButton);
        const capacityInput = screen.getByPlaceholderText('Ej. 22');
        await user.clear(capacityInput);
        await user.type(capacityInput, '30');
        const submitButton = screen.getByText('Guardar Cambios');
        await user.click(submitButton);
        expect(sportsService.update).toHaveBeenCalledWith(
            '1',
            expect.objectContaining({
                max_capacity: 30,
            }),
        );
    });
});
