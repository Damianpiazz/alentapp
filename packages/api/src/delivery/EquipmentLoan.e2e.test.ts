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
        // Limpiamos la base de datos (Tear down) eliminando los registros
        if (createdLoanId) {
            await prisma.equipmentLoan.deleteMany({
                where: { id: createdLoanId },
            });
        }
        if (createdMemberId) {
            await prisma.member.deleteMany({
                where: { id: createdMemberId },
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

    it('3. POST: Debe fallar al crear si el member_id no existe en la DB real', async () => {
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

        // Anular variable para que afterAll no intente borrarlo nuevamente
        createdLoanId = '';
    });
});
