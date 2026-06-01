import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Equipment Loan API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdLoanId: string;
    let createdMemberId: string;
    let cadeteMemberId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();

    beforeAll(async () => {
        // 1. Levantamos la app entera (incluyendo PostgreSQL via el Repositorio original)
        app = buildApp();
        await app.ready();

        // 2. Instanciamos Prisma independientemente para comprobar la Base de Datos
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        // 3. Creamos un socio de prueba vía Prisma para poder asignarlo a los préstamos
        const member = await prisma.member.create({
            data: {
                dni: `E2E_LOAN_${randomSuffix}`,
                name: 'Loan Test Member',
                email: `loan_e2e${randomSuffix}@test.com`,
                birthdate: new Date('1990-01-01'),
                category: 'Pleno',
                status: 'Activo',
            },
        });
        createdMemberId = member.id;
    });

    afterAll(async () => {
        if (createdMemberId) {
            await prisma.equipmentLoan.deleteMany({
                where: { member_id: createdMemberId },
            });
            await prisma.member.deleteMany({
                where: { id: createdMemberId },
            });
        }
        if (cadeteMemberId) {
            await prisma.equipmentLoan.deleteMany({
                where: { member_id: cadeteMemberId },
            });
            await prisma.member.deleteMany({
                where: { id: cadeteMemberId },
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. GET: Debe retornar la lista de préstamos existente', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/prestamos',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(Array.isArray(body.data)).toBe(true);
    });

    it('2. POST: Debe crear un préstamo en la base de datos real', async () => {
        // Fecha 30 días en el futuro para pasar la validación de due_date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const payload = {
            item_name: 'Pelota de fútbol E2E',
            due_date: futureDate.toISOString(),
            member_id: createdMemberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.item_name).toBe('Pelota de fútbol E2E');
        expect(body.data.status).toBe('Loaned');

        // Guardamos el ID para usarlo en los siguientes tests
        createdLoanId = body.data.id;

        // Verificación directa E2E: ¿Se guardó realmente en PostgreSQL?
        const dbLoan = await prisma.equipmentLoan.findUnique({
            where: { id: createdLoanId },
        });
        expect(dbLoan).not.toBeNull();
        expect(dbLoan?.item_name).toBe('Pelota de fútbol E2E');
        expect(dbLoan?.status).toBe('Loaned');
    });

    it('3. POST: Debe fallar al crear si el member_id no existe', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const payload = {
            item_name: 'Préstamo inválido',
            due_date: futureDate.toISOString(),
            member_id: '00000000-0000-0000-0000-000000000000', // UUID que no existe
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload,
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('No existe un miembro con ese id');
    });

    it('4. PUT: Debe actualizar el estado del préstamo a Returned en la base de datos', async () => {
        const updatePayload = {
            status: 'Returned',
        };

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/prestamos/${createdLoanId}`,
            payload: updatePayload,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.status).toBe('Returned');

        // Verificar directamente en PostgreSQL que el campo se modificó
        const dbLoan = await prisma.equipmentLoan.findUnique({
            where: { id: createdLoanId },
        });
        expect(dbLoan?.status).toBe('Returned');
    });

    it('5. DELETE: Debe eliminar (soft delete) el préstamo de la base de datos', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/prestamos/${createdLoanId}`,
        });

        expect(response.statusCode).toBe(204);

        // Soft delete: el registro no se borra físicamente, se setea deleted_at
        const dbLoan = await prisma.equipmentLoan.findUnique({
            where: { id: createdLoanId },
        });
        expect(dbLoan?.deleted_at).not.toBeNull();

        createdLoanId = '';
    });

    it('6. POST: Debe fallar si item_name está vacío (400)', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload: {
                item_name: '',
                due_date: futureDate.toISOString(),
                member_id: createdMemberId,
            },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El nombre del ítem es muy corto o inválido');
    });

    it('7. POST: Debe fallar si due_date está en el pasado (400)', async () => {
        const pastDate = new Date('2020-01-01');

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload: {
                item_name: 'Pelota',
                due_date: pastDate.toISOString(),
                member_id: createdMemberId,
            },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe(
            'La fecha de devolución debe ser posterior a la fecha de préstamo',
        );
    });

    it('8. POST: Debe fallar si el socio es categoría Cadete (400)', async () => {
        const cadeteMember = await prisma.member.create({
            data: {
                dni: `E2E_CADETE_${randomSuffix}`,
                name: 'Cadete Member',
                email: `cadete_e2e${randomSuffix}@test.com`,
                birthdate: new Date('1990-01-01'),
                category: 'Cadete',
                status: 'Activo',
            },
        });
        cadeteMemberId = cadeteMember.id;

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload: {
                item_name: 'Pelota',
                due_date: futureDate.toISOString(),
                member_id: cadeteMember.id,
            },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe(
            'Si el miembro es de categoría "Cadete" no pueden solicitar préstamos',
        );
    });

    it('9. PUT: Debe fallar si el préstamo no existe (404)', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/prestamos/00000000-0000-0000-0000-000000000000`,
            payload: { status: 'Returned' },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El préstamo no existe');
    });

    it('10. PUT: Debe fallar si el préstamo no está en estado Loaned (409)', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const createRes = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload: {
                item_name: 'Temp loan for 409 test',
                due_date: futureDate.toISOString(),
                member_id: createdMemberId,
            },
        });
        expect(createRes.statusCode).toBe(201);
        const tempLoanId = JSON.parse(createRes.payload).data.id;

        const updateReturnedRes = await app.inject({
            method: 'PUT',
            url: `/api/v1/prestamos/${tempLoanId}`,
            payload: { status: 'Returned' },
        });
        expect(updateReturnedRes.statusCode).toBe(200);

        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/prestamos/${tempLoanId}`,
            payload: { status: 'Returned' },
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe(
            'Solo se pueden actualizar préstamos en estado Loaned',
        );
    });

    it('11. DELETE: Debe ser idempotente si el préstamo ya fue eliminado (204)', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const createRes = await app.inject({
            method: 'POST',
            url: '/api/v1/prestamos',
            payload: {
                item_name: 'Temp loan for idempotent delete',
                due_date: futureDate.toISOString(),
                member_id: createdMemberId,
            },
        });
        expect(createRes.statusCode).toBe(201);
        const tempLoanId = JSON.parse(createRes.payload).data.id;

        const firstDelete = await app.inject({
            method: 'DELETE',
            url: `/api/v1/prestamos/${tempLoanId}`,
        });
        expect(firstDelete.statusCode).toBe(204);

        const secondDelete = await app.inject({
            method: 'DELETE',
            url: `/api/v1/prestamos/${tempLoanId}`,
        });
        expect(secondDelete.statusCode).toBe(204);
    });
});
