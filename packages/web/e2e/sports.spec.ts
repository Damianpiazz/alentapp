import { test, expect } from '@playwright/test';

test.describe('Sports E2E (UI Integration)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) =>
            console.log('BROWSER CONSOLE:', msg.text()),
        );
        const mockDb = [
            {
                id: '1',
                name: 'Fútbol',
                description: 'Deporte en equipo',
                max_capacity: 22,
                additional_price: 10,
                requires_medical_certificate: false,
                created_at: new Date().toISOString(),
                deleted_at: null,
            },
        ];
        await page.route(/\/api\/v1\/sports/, async (route) => {
            const method = route.request().method();
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDb }),
                });
            } else if (method === 'POST') {
                const payload = route.request().postDataJSON();
                const newSport = {
                    id: String(mockDb.length + 1),
                    created_at: new Date().toISOString(),
                    deleted_at: null,
                    ...payload,
                };
                mockDb.push(newSport);
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: newSport }),
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
        await page.goto('/sports');
    });
    test('debe mostrar la lista de deportes cargada desde el network interceptado', async ({
        page,
    }) => {
        await expect(page.getByText('Fútbol')).toBeVisible();
        await expect(page.getByText('Deporte en equipo')).toBeVisible();
    });
    test('debe abrir el modal de creación y enviar el formulario de red', async ({
        page,
    }) => {
        await page.locator('button:has-text("Agregar Deporte")').click();
        await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();
        await page.getByPlaceholder('Ej. Fútbol').fill('Basket');
        await page
            .getByPlaceholder('Ej. Deporte colectivo de 11 jugadores')
            .fill('Deporte de canasta');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(
            page.getByRole('button', { name: 'Crear Deporte' }),
        ).toBeHidden();
        await expect(page.getByText('Basket')).toBeVisible();
        await expect(page.getByText('Deporte de canasta')).toBeVisible();
    });
    test('debe abrir el modal de edición, actualizar datos y mostrar el cambio', async ({
        page,
    }) => {
        await page.getByRole('button', { name: /Editar deporte/i }).click();
        await expect(page.getByText('Editar Deporte')).toBeVisible();
        await page.getByPlaceholder('Ej. 22').fill('30');
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(
            page.getByRole('button', { name: 'Guardar Cambios' }),
        ).toBeHidden();
        await expect(page.getByText('30')).toBeVisible();
    });
    test('debe poder eliminar un deporte tras aceptar la alerta de confirmación', async ({
        page,
    }) => {
        page.on('dialog', (dialog) => dialog.accept());
        await expect(page.getByText('Fútbol')).toBeVisible();
        await page.getByRole('button', { name: /Eliminar deporte/i }).click();
        await expect(
            page.getByText('No se encontraron deportes.'),
        ).toBeVisible();
        await expect(page.getByText('Fútbol')).toBeHidden();
    });
});
