import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Discipline API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdDisciplineId: string;
    let createdMemberId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testDni = `E2E${randomSuffix}`;
    const testEmail = `e2e${randomSuffix}@test.com`;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as string),
        });
        await prisma.$connect();

        const member = await prisma.member.create({
            data: {
                dni: testDni,
                name: 'Socio E2E Discipline',
                email: testEmail,
                category: 'Pleno',
            },
        });
        createdMemberId = member.id;
    });

    afterAll(async () => {
        if (createdDisciplineId) {
            await prisma.discipline.deleteMany({
                where: { id: createdDisciplineId },
            });
        }
        if (createdMemberId) {
            await prisma.member.deleteMany({ where: { id: createdMemberId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear una sanción en la base de datos real', async () => {
        const payload = {
            member_id: createdMemberId,
            reason: 'Conducta inapropiada E2E',
            start_date: '2026-05-01',
            end_date: '2026-06-01',
            is_total_suspension: false,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.data.id).toBeDefined();
        expect(body.data.reason).toBe('Conducta inapropiada E2E');

        createdDisciplineId = body.data.id;

        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.reason).toBe('Conducta inapropiada E2E');
    });

    it('2. PUT: Debe actualizar la sanción en la base de datos real', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/disciplines/${createdDisciplineId}`,
            payload: { reason: 'Motivo actualizado E2E' },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.reason).toBe('Motivo actualizado E2E');

        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline?.reason).toBe('Motivo actualizado E2E');
    });

    it('3. DELETE: Debe eliminar físicamente la sanción de la base de datos', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/disciplines/${createdDisciplineId}`,
        });

        expect(response.statusCode).toBe(204);

        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline).toBeNull();

        createdDisciplineId = '';
    });
});
