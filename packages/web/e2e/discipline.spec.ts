import { test, expect } from '@playwright/test';

test.describe('Disciplines E2E (UI Integration)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) =>
            console.log('BROWSER CONSOLE:', msg.text()),
        );

        const mockDb = [
            {
                id: '1',
                member_id: 'member-1',
                reason: 'Conducta inapropiada',
                start_date: '2026-05-01',
                end_date: '2026-06-01',
                is_total_suspension: false,
                created_at: new Date().toISOString(),
            },
        ];

        const mockMembers = [
            {
                id: 'member-1',
                dni: '12345678',
                name: 'Juan Perez',
                email: 'juan@test.com',
                birthdate: '1990-01-01',
                category: 'Pleno',
                status: 'Activo',
                created_at: new Date().toISOString(),
            },
        ];

        // Interceptamos las llamadas a socios para mostrar el socio en el select
        await page.route(/\/api\/v1\/socios/, async (route) => {
            const method = route.request().method();
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockMembers }),
                });
            } else if (method === 'OPTIONS') {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods':
                            'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers':
                            'Content-Type, Authorization',
                    },
                });
            } else {
                await route.continue();
            }
        });

        // Interceptamos las llamadas a disciplines
        await page.route(/\/api\/v1\/disciplines/, async (route) => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDb }),
                });
            } else if (method === 'POST') {
                const payload = route.request().postDataJSON();
                const newDiscipline = {
                    id: String(mockDb.length + 1),
                    created_at: new Date().toISOString(),
                    ...payload,
                };
                mockDb.push(newDiscipline);
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: newDiscipline }),
                });
            } else if (method === 'OPTIONS') {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods':
                            'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers':
                            'Content-Type, Authorization',
                    },
                });
            } else if (method === 'PUT') {
                const urlObj = new URL(route.request().url());
                const id = urlObj.pathname.split('/').pop();
                const payload = route.request().postDataJSON();
                const index = mockDb.findIndex(
                    (m) => String(m.id) === String(id),
                );

                if (index > -1) {
                    mockDb[index] = { ...mockDb[index], ...payload };
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: mockDb[index] }),
                    });
                } else {
                    await route.fulfill({
                        status: 404,
                        body: JSON.stringify({ error: 'Not found' }),
                    });
                }
            } else if (method === 'DELETE') {
                const urlObj = new URL(route.request().url());
                const id = urlObj.pathname.split('/').pop();
                const index = mockDb.findIndex(
                    (m) => String(m.id) === String(id),
                );
                if (index > -1) {
                    mockDb.splice(index, 1);
                }
                await route.fulfill({ status: 204 });
            } else {
                await route.continue();
            }
        });

        await page.goto('/disciplines');
    });

    test('debe mostrar la lista de sanciones cargada desde el network interceptado', async ({
        page,
    }) => {
        await expect(page.getByText('Conducta inapropiada')).toBeVisible();
        await expect(page.getByText('Juan Perez')).toBeVisible();
    });

    test('debe abrir el modal de creación y enviar el formulario', async ({
        page,
    }) => {
        await page.locator('button:has-text("Nueva Sanción")').click();

        await expect(
            page.getByText('Nueva Sanción Disciplinaria'),
        ).toBeVisible();

        await page.locator('select').selectOption('member-1');
        await page
            .getByPlaceholder('Describe el motivo de la sanción')
            .fill('Conducta violenta E2E');
        await page.locator('input[type="date"]').first().fill('2026-07-01');
        await page.locator('input[type="date"]').last().fill('2026-08-01');

        await page.getByRole('button', { name: 'Crear Sanción' }).click();

        await expect(
            page.getByRole('button', { name: 'Crear Sanción' }),
        ).toBeHidden();
        await expect(page.getByText('Conducta violenta E2E')).toBeVisible();
    });

    test('debe abrir el modal de edición, actualizar datos y mostrar el cambio', async ({
        page,
    }) => {
        await page.getByRole('button', { name: /Editar sanción/i }).click();

        await expect(page.getByText('Editar Sanción')).toBeVisible();

        await page
            .getByPlaceholder('Describe el motivo de la sanción')
            .fill('Motivo modificado E2E');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        await expect(
            page.getByRole('button', { name: 'Guardar Cambios' }),
        ).toBeHidden();
        await expect(page.getByText('Motivo modificado E2E')).toBeVisible();
    });

    test('debe poder eliminar una sanción tras aceptar la alerta de confirmación', async ({
        page,
    }) => {
        page.on('dialog', (dialog) => dialog.accept());

        await expect(page.getByText('Conducta inapropiada')).toBeVisible();

        await page.getByRole('button', { name: /Eliminar sanción/i }).click();

        await expect(
            page.getByText('No se encontraron sanciones.'),
        ).toBeVisible();
        await expect(page.getByText('Conducta inapropiada')).toBeHidden();
    });
});
