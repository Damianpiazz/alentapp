import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { CreateSportRequest } from '@alentapp/shared';

describe('CreateSportUseCase', () => {
    // 1. Mocks de dependencias
    const mockSportRepo = {
        create: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateName: vi.fn(),
        validateDescription: vi.fn(),
        validateMaxCapacity: vi.fn(),
        validateAdditionalPrice: vi.fn(),
        validateNameIsUnique: vi.fn(),
        normalizeName: vi.fn(),
        normalizeDescription: vi.fn(),
    } as unknown as SportValidator;

    // 2. Instancia del use case
    const useCase = new CreateSportUseCase(mockSportRepo, mockSportValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un deporte correctamente con datos válidos', async () => {
        const mockRequest: CreateSportRequest = {
            name: 'Fútbol',
            description: 'Deporte colectivo',
            max_capacity: 22,
            additional_price: 1000,
            requires_medical_certificate: false,
        };

        vi.mocked(mockSportValidator.normalizeName).mockReturnValue('Fútbol');
        vi.mocked(mockSportValidator.normalizeDescription).mockReturnValue(
            'Deporte colectivo',
        );

        vi.mocked(mockSportRepo.create).mockResolvedValueOnce({
            id: 'sport-1',
            ...mockRequest,
            created_at: '2026-04-28T00:00:00.000Z',
        });

        const result = await useCase.execute(mockRequest);

        // Validaciones ejecutadas
        expect(mockSportValidator.validateName).toHaveBeenCalledWith(
            mockRequest.name,
        );
        expect(mockSportValidator.validateDescription).toHaveBeenCalledWith(
            mockRequest.description,
        );
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(
            mockRequest.max_capacity,
        );
        expect(mockSportValidator.validateAdditionalPrice).toHaveBeenCalledWith(
            mockRequest.additional_price,
        );

        expect(mockSportValidator.validateNameIsUnique).toHaveBeenCalledWith(
            'Fútbol',
        );

        // Persistencia
        expect(mockSportRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Fútbol',
                description: 'Deporte colectivo',
                max_capacity: 22,
                additional_price: 1000,
                requires_medical_certificate: false,
            }),
        );

        expect(result.id).toBe('sport-1');
    });

    it('debe normalizar nombre y descripción antes de guardar', async () => {
        const mockRequest: CreateSportRequest = {
            name: '  Fútbol  ',
            description: '  Deporte colectivo  ',
            max_capacity: 10,
            additional_price: 0,
            requires_medical_certificate: false,
        };

        vi.mocked(mockSportValidator.normalizeName).mockReturnValue('Fútbol');
        vi.mocked(mockSportValidator.normalizeDescription).mockReturnValue(
            'Deporte colectivo',
        );

        vi.mocked(mockSportRepo.create).mockResolvedValueOnce({
            id: 'sport-2',
            ...mockRequest,
            created_at: '2026-04-28T00:00:00.000Z',
        });

        await useCase.execute(mockRequest);

        expect(mockSportRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Fútbol',
                description: 'Deporte colectivo',
            }),
        );
    });
});
