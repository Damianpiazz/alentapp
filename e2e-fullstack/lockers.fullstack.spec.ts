import { test, expect } from '@playwright/test';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const DB_URL = process.env.DATABASE_URL_E2E!;

async function cleanDatabase() {
    const client = new pg.Client({
        connectionString: DB_URL,
    });

    await client.connect();

    try {
        const res = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename != '_prisma_migrations';
        `);

        const tables = res.rows.map((row) => `"${row.tablename}"`).join(', ');

        if (tables) {
            await client.query(
                `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
            );
        }
    } finally {
        await client.end();
    }
}

test.describe('Lockers Full-Stack E2E', () => {
    test.beforeEach(async () => {
        await cleanDatabase();
    });
    test('debe mostrar estado vacío cuando no existen lockers', async ({
        page,
    }) => {
        await page.goto('http://127.0.0.1:5174/lockers');

        await expect(page.getByText('Administración de Lockers')).toBeVisible({
            timeout: 10000,
        });

        await expect(page.locator('tbody tr')).toHaveCount(0);
    });

    test('debe crear un locker real y mostrarlo en tabla', async ({ page }) => {
        await page.goto('http://127.0.0.1:5174/lockers');

        await page.locator('button:has-text("Agregar Locker")').click();

        await expect(page.getByText('Agregar Nuevo Locker')).toBeVisible();

        await page.getByPlaceholder('Ej. 101').fill('777');

        await page
            .getByRole('button', {
                name: 'Crear Locker',
            })
            .click();

        await page.pause();

        await expect(page.getByText('777')).toBeVisible({
            timeout: 10000,
        });
    });

    test('debe editar locker existente', async ({ page }) => {
        await page.goto('http://127.0.0.1:5174/lockers');

        await page.locator('button:has-text("Agregar Locker")').click();

        await page.getByPlaceholder('Ej. 101').fill('333');

        await page
            .getByRole('button', {
                name: 'Crear Locker',
            })
            .click();

        await page.pause();

        await expect(page.getByText('333')).toBeVisible({
            timeout: 10000,
        });

        await page
            .getByRole('button', {
                name: /Editar/i,
            })
            .first()
            .click();

        const input = page.getByPlaceholder('Ej. 101');

        await input.clear();
        await input.fill('888');

        await page
            .getByRole('button', {
                name: 'Actualizar Locker',
            })
            .click();

        await page.pause();

        await expect(page.getByText('888')).toBeVisible({
            timeout: 10000,
        });
    });
});
