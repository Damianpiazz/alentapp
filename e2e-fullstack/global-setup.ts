/**
 * global-setup.ts para Playwright Full-Stack E2E con Docker Compose.
 */
import type { FullConfig } from '@playwright/test';
import pg from 'pg';

const API_URL = 'http://localhost:3001';
const DB_URL = 'postgresql://admin:password123@127.0.0.1:5433/alentapp_test_db';

const MAX_WAIT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;

async function waitForApi(): Promise<void> {
    const start = Date.now();

    process.stdout.write('[E2E Setup] Esperando API...');

    while (Date.now() - start < MAX_WAIT_MS) {
        try {
            const res = await fetch(`${API_URL}/`);

            console.log(`\nSTATUS: ${res.status}`);

            if (res.ok || res.status < 500) {
                console.log('✓ API lista');
                return;
            }
        } catch (error) {
            console.log('\nERROR FETCH:', error);
        }

        process.stdout.write('.');
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    throw new Error(
        `[E2E Setup] La API no respondió después de ${MAX_WAIT_MS / 1000}s.`,
    );
}

async function cleanDatabase(): Promise<void> {
    console.log('A - Entrando a cleanDatabase');
    console.log('DB_URL:', DB_URL);
    const client = new pg.Client({
        connectionString: DB_URL,
    });

    console.log('DB_URL:', DB_URL);
    await client.connect();

    console.log('C - Conectado a PostgreSQL');

    try {
        const res = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename != '_prisma_migrations';
        `);

        console.log('D - Tablas obtenidas');

        const tables = res.rows.map((row) => `"${row.tablename}"`).join(', ');

        console.log('E - Tables:', tables);

        if (tables) {
            await client.query(
                `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
            );

            console.log('F - Tablas truncadas');
        }
    } catch (error) {
        console.error('ERROR DENTRO DE cleanDatabase:', error);

        throw error;
    } finally {
        console.log('G - Cerrando conexión');

        await client.end();

        console.log('H - Conexión cerrada');
    }
}

export default async function globalSetup(_config: FullConfig) {
    console.log('1 - Inicio globalSetup');

    await waitForApi();

    console.log('2 - API OK');

    //await cleanDatabase();

    console.log('3 - Database OK');

    console.log('[E2E Setup] Listo. Corriendo tests...');
}
