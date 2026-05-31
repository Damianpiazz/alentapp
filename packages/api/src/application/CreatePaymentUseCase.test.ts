import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './CreatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { CreatePaymentRequest, PaymentDTO, MemberDTO } from '@alentapp/shared';

describe('CreatePaymentUseCase', () => {
    // 1. creo Mocks de puertos y servicios
    const mockPaymentRepo = {
        create: vi.fn(),
    } as unknown as PaymentRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockValidator = {
        validateRequiredFields: vi.fn(),
    } as unknown as PaymentValidator;

    // 2. instacia del caso de uso inyectando los mocks
    const useCase = new CreatePaymentUseCase(
        mockPaymentRepo,
        mockMemberRepo,
        mockValidator,
    );

    const validRequest: CreatePaymentRequest = {
        amount: 5000,
        month: 10,
        year: 2026,
        due_date: '2026-10-15',
        member_id: 'uuid-socio-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    //test1
    it('debe crear un pago exitosamente si los datos son correctos y el socio existe', async () => {
        // respuesta de la base de datos para el socio
        const mockMember = { id: 'uuid-socio-1', name: 'Juan Perez' };
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(
            mockMember as unknown as MemberDTO,
        );

        // respuesta de la base de datos al persistir el pago
        const mockCreatedPayment = {
            id: 'uuid-pago-1',
            ...validRequest,
            status: 'Pending',
            payment_date: null,
            deleted_at: null,
        };
        vi.mocked(mockPaymentRepo.create).mockResolvedValueOnce(
            mockCreatedPayment as unknown as PaymentDTO,
        );

        const result = await useCase.execute(validRequest);

        // verifico que se hayan llamado las validaciones de negocio
        expect(mockValidator.validateRequiredFields).toHaveBeenCalledWith(
            validRequest,
        );
        expect(mockMemberRepo.findById).toHaveBeenCalledWith('uuid-socio-1');

        // verifico que se haya intentado persistir el pago
        expect(mockPaymentRepo.create).toHaveBeenCalled();
        expect(result).toEqual(mockCreatedPayment);
    });

    //test2
    it('debe lanzar error si el monto es cero', async () => {
        const invalidRequest = { ...validRequest, amount: 0 };

        // simulo que el validador detecta el error de negocio
        vi.mocked(mockValidator.validateRequiredFields).mockImplementationOnce(
            () => {
                throw new Error('El monto debe ser mayor a cero');
            },
        );

        await expect(useCase.execute(invalidRequest)).rejects.toThrow(
            'El monto debe ser mayor a cero',
        );
        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
    });

    //test3
    it('debe lanzar error si el monto es negativo', async () => {
        const invalidRequest = { ...validRequest, amount: -100 };

        // simulo que el validador detecta el error de negocio
        vi.mocked(mockValidator.validateRequiredFields).mockImplementationOnce(
            () => {
                throw new Error('El monto debe ser mayor a cero');
            },
        );

        await expect(useCase.execute(invalidRequest)).rejects.toThrow(
            'El monto debe ser mayor a cero',
        );
    });

    //test4
    it('debe asignar automáticamente el estado Pending y anular fechas', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({
            id: 'uuid-socio-1',
        } as unknown as MemberDTO);
        vi.mocked(mockPaymentRepo.create).mockResolvedValueOnce(
            {} as unknown as PaymentDTO,
        );

        await useCase.execute(validRequest);

        // verifco que el caso de uso haya forzado el estado y las fechas antes de guardarlo
        expect(mockPaymentRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'Pending',
                payment_date: null,
                deleted_at: null,
            }),
        );
    });

    //test5
    it('debe lanzar error si el socio no existe', async () => {
        // simulo que el socio no existe en la base de datos
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'Socio no encontrado',
        );
        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });
});
