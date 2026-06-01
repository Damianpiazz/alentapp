import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';
import { CreatePaymentRequest } from '@alentapp/shared';

describe('PaymentValidator', () => {
    const validator = new PaymentValidator();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateRequiredFields', () => {
        //test1
        it('debe lanzar error si faltan campos obligatorios', () => {
            const invalidData = {
                amount: 500,
            } as Partial<CreatePaymentRequest>;

            expect(() =>
                validator.validateRequiredFields(
                    invalidData as CreatePaymentRequest,
                ),
            ).toThrow(/Faltan datos obligatorios/);
        });

        //test2
        it('debe lanzar error si el monto es menor o igual a cero', () => {
            const invalidData: CreatePaymentRequest = {
                amount: 0,
                month: 10,
                year: 2026,
                due_date: '2026-10-15',
                member_id: 'socio-1',
            };

            expect(() => validator.validateRequiredFields(invalidData)).toThrow(
                'El monto debe ser mayor a cero',
            );
        });
    });

    describe('validateForUpdate', () => {
        //test3
        it('debe lanzar error si el estado actual es Paid', () => {
            expect(() => validator.validateForUpdate('Paid')).toThrow(
                'El pago ya se encuentra procesado',
            );
        });

        //test4
        it('debe lanzar error si el estado actual es Canceled', () => {
            expect(() => validator.validateForUpdate('Canceled')).toThrow(
                'No se puede modificar un pago que fue anulado',
            );
        });

        //test4
        it('debe lanzar error si el monto a actualizar es menor o igual a cero', () => {
            expect(() =>
                validator.validateUpdateFields({
                    amount: 0,
                }),
            ).toThrow('El monto debe ser mayor a cero');

            expect(() =>
                validator.validateUpdateFields({
                    amount: -100,
                }),
            ).toThrow('El monto debe ser mayor a cero');
        });
    });

    describe('validateForCancel', () => {
        //test5
        it('debe lanzar error si el estado actual es Paid', () => {
            expect(() => validator.validateForCancel('Paid')).toThrow(
                'No se puede anular un pago ya procesado',
            );
        });
    });
});
