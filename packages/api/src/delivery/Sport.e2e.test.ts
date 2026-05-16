import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Sport API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdSportId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testName = `Futbol E2E ${randomSuffix}`;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });

        await prisma.$connect();
    });

    afterAll(async () => {
        if (createdSportId) {
            await prisma.sport.deleteMany({
                where: { id: createdSportId },
            });
        }

        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: Debe crear un deporte en la base de datos real', async () => {
        const payload = {
            name: testName,
            description: 'Deporte E2E',
            max_capacity: 20,
            additional_price: 15,
            requires_medical_certificate: false,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload,
        });

        expect(response.statusCode).toBe(201);

        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.name).toBe(testName);

        createdSportId = body.data.id;

        // Verificación directa en DB real
        const dbSport = await prisma.sport.findUnique({
            where: { id: createdSportId },
        });

        expect(dbSport).not.toBeNull();
        expect(dbSport?.name).toBe(testName);
    });

    it('2. POST: Debe fallar si el nombre ya existe en DB', async () => {
        const payload = {
            name: testName, // duplicado
            description: 'Otro deporte',
            max_capacity: 10,
            additional_price: 5,
            requires_medical_certificate: false,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload,
        });

        expect(response.statusCode).toBe(409);

        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Ya existe un deporte con ese nombre');
    });

    it('3. POST: Debe fallar si max_capacity es inválido', async () => {
        const payload = {
            name: `Basket ${randomSuffix}`,
            description: 'Deporte',
            max_capacity: 0, // inválido
            additional_price: 10,
            requires_medical_certificate: false,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/sports',
            payload,
        });

        expect(response.statusCode).toBe(400);
    });
});
