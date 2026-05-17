import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { UpdateSportRequest, SportDTO } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as SportRepository;
    const mockSportValidator = {
        validateMaxCapacity: vi.fn(),
        normalizeDescription: vi.fn(),
    } as unknown as SportValidator;
    const useCase = new UpdateSportUseCase(mockSportRepo, mockSportValidator);
    const mockExistingSport: SportDTO = {
        id: 'sport-1',
        name: 'Fútbol',
        description: 'Deporte colectivo',
        max_capacity: 22,
        additional_price: 1000,
        requires_medical_certificate: false,
        created_at: '2026-04-28T00:00:00.000Z',
    };
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockSportRepo.findById).mockResolvedValue(mockExistingSport);
    });
    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);
        await expect(useCase.execute('uuid-no', {})).rejects.toThrow(
            'El deporte solicitado no existe',
        );
    });
    it('debe actualizar correctamente con datos parciales', async () => {
        const updateData: UpdateSportRequest = {
            description: 'Nueva descripción',
            max_capacity: 30,
        };
        const updatedSport = { ...mockExistingSport, ...updateData };
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce(updatedSport);
        const result = await useCase.execute('sport-1', updateData);
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(30);
        expect(mockSportRepo.update).toHaveBeenCalledWith(
            'sport-1',
            expect.objectContaining(updateData),
        );
        expect(result.max_capacity).toBe(30);
    });
    it('debe validar max_capacity solo si fue enviado', async () => {
        const updateData: UpdateSportRequest = {
            description: 'Solo cambio descripción',
        };
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce({
            ...mockExistingSport,
            ...updateData,
        });
        await useCase.execute('sport-1', updateData);
        expect(mockSportValidator.validateMaxCapacity).not.toHaveBeenCalled();
    });
    it('debe normalizar la descripción antes de actualizar', async () => {
        const updateData: UpdateSportRequest = {
            description: '  Descripción con espacios  ',
        };
        vi.mocked(mockSportValidator.normalizeDescription).mockReturnValue(
            'Descripción con espacios',
        );
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce({
            ...mockExistingSport,
            description: 'Descripción con espacios',
        });
        await useCase.execute('sport-1', updateData);
        expect(mockSportValidator.normalizeDescription).toHaveBeenCalledWith(
            '  Descripción con espacios  ',
        );
        expect(mockSportRepo.update).toHaveBeenCalledWith(
            'sport-1',
            expect.objectContaining({
                description: 'Descripción con espacios',
            }),
        );
    });
    it('debe mantener el nombre original aunque se intente enviar', async () => {
        const updateData: UpdateSportRequest = {
            max_capacity: 25,
        };
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce({
            ...mockExistingSport,
            max_capacity: 25,
        });
        const result = await useCase.execute('sport-1', updateData);
        expect(result.name).toBe('Fútbol');
        expect(mockSportRepo.update).toHaveBeenCalledWith(
            'sport-1',
            expect.not.objectContaining({ name: expect.anything() }),
        );
    });
});
