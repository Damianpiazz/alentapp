import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:3001/api/v1';

test.describe('Disciplines Full-Stack E2E', () => {
    let memberId: string;
    let memberName: string;
    let disciplineId: string;

    test.beforeEach(async () => {
        const context = await request.newContext();
        // Sufijo único por test para evitar colisiones entre tests paralelos que comparten la misma DB.
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const memberResponse = await context.post(`${API_URL}/socios`, {
            data: {
                name: `Socio E2E Discipline ${uniqueSuffix}`,
                dni: `E2E${Math.floor(Math.random() * 100000)}`,
                email: `e2e${Math.floor(Math.random() * 100000)}@test.com`,
                birthdate: '1995-06-15',
                category: 'Pleno',
            },
        });
        const memberBody = await memberResponse.json();
        memberId = memberBody.data.id;
        memberName = memberBody.data.name;
        await context.dispose();
    });

    test.afterEach(async () => {
        const context = await request.newContext();
        if (disciplineId) {
            await context.delete(`${API_URL}/disciplines/${disciplineId}`);
            disciplineId = '';
        }
        if (memberId) {
            await context.delete(`${API_URL}/socios/${memberId}`);
            memberId = '';
        }
        await context.dispose();
    });

    test('debe mostrar el estado vacío cuando no hay sanciones en la DB', async ({
        page,
    }) => {
        await page.goto('/disciplines', { waitUntil: 'networkidle' });
        await expect(
            page.getByText('No se encontraron sanciones.'),
        ).toBeVisible({ timeout: 10000 });
    });

    test('debe crear una sanción real y mostrarla en la tabla', async ({
        page,
    }) => {
        await page.goto('/disciplines', { waitUntil: 'networkidle' });

        await page.locator('button:has-text("Nueva Sanción")').click();
        await expect(
            page.getByText('Nueva Sanción Disciplinaria'),
        ).toBeVisible();

        const memberSelect = page.locator('select');
        await memberSelect.waitFor({ state: 'visible' });
        await page.waitForFunction(
            () => (document.querySelector('select')?.options.length ?? 0) > 1,
            { timeout: 10000 },
        );

        await memberSelect.selectOption({ value: memberId });
        await page
            .getByPlaceholder('Describe el motivo de la sanción')
            .fill('Conducta inapropiada E2E Fullstack');
        await page.locator('input[type="date"]').first().fill('2026-05-01');
        await page.locator('input[type="date"]').last().fill('2026-06-01');

        await page.getByRole('button', { name: 'Crear Sanción' }).click();

        await expect(
            page.getByRole('button', { name: 'Crear Sanción' }),
        ).toBeHidden();

        const row = page.getByRole('row', { name: memberName });
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(
            row.getByText('Conducta inapropiada E2E Fullstack'),
        ).toBeVisible();
    });

    test('debe editar una sanción y ver el cambio en la tabla', async ({
        page,
    }) => {
        const context = await request.newContext();
        const disciplineResponse = await context.post(
            `${API_URL}/disciplines`,
            {
                data: {
                    member_id: memberId,
                    reason: 'Conducta inapropiada E2E Fullstack',
                    start_date: '2026-05-01',
                    end_date: '2026-06-01',
                    is_total_suspension: false,
                },
            },
        );
        const disciplineBody = await disciplineResponse.json();
        disciplineId = disciplineBody.data.id;
        await context.dispose();

        await page.goto('/disciplines', { waitUntil: 'networkidle' });

        const row = page.getByRole('row', { name: memberName });
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(
            row.getByText('Conducta inapropiada E2E Fullstack'),
        ).toBeVisible();

        await row.getByRole('button', { name: /Editar sanción/i }).click();
        await expect(page.getByText('Editar Sanción')).toBeVisible();

        await page
            .getByPlaceholder('Describe el motivo de la sanción')
            .fill('Conducta inapropiada E2E Fullstack Editada');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(
            page.getByRole('button', { name: 'Guardar Cambios' }),
        ).toBeHidden();

        await expect(
            row.getByText('Conducta inapropiada E2E Fullstack Editada'),
        ).toBeVisible({ timeout: 10000 });
        await expect(
            row.getByText('Conducta inapropiada E2E Fullstack', {
                exact: true,
            }),
        ).toBeHidden();
    });

    test('debe eliminar una sanción y mostrar el estado vacío', async ({
        page,
    }) => {
        const context = await request.newContext();
        const disciplineResponse = await context.post(
            `${API_URL}/disciplines`,
            {
                data: {
                    member_id: memberId,
                    reason: 'Conducta inapropiada E2E Fullstack',
                    start_date: '2026-05-01',
                    end_date: '2026-06-01',
                    is_total_suspension: false,
                },
            },
        );
        const disciplineBody = await disciplineResponse.json();
        disciplineId = disciplineBody.data.id;
        await context.dispose();

        await page.goto('/disciplines', { waitUntil: 'networkidle' });

        const row = page.getByRole('row', { name: memberName });
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(
            row.getByText('Conducta inapropiada E2E Fullstack'),
        ).toBeVisible();

        page.on('dialog', (dialog) => dialog.accept());

        await row.getByRole('button', { name: /Eliminar sanción/i }).click();

        await expect(row).toBeHidden({ timeout: 10000 });
    });
});
