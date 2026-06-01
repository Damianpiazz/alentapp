import { test, expect } from '@playwright/test';
import { EquipmentLoan } from '../../api/src/generated/client/index.js';
import { Member } from '../../api/src/generated/client/index.js';

test.describe('Equipment Loan E2E (UI Integration)', () => {
    let mockDbLoans: EquipmentLoan[];
    let mockDbMembers: Member[];

    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) =>
            console.log('BROWSER CONSOLE:', msg.text()),
        );
        mockDbLoans = [];
        mockDbMembers = [
            {
                id: 'member-1',
                dni: '12345678',
                name: 'Juan Pérez',
                email: 'juan@test.com',
                birthdate: '1990-01-01',
                category: 'Pleno',
                status: 'Activo',
                created_at: new Date().toISOString(),
            },
        ];

        await page.route(/\/api\/v1\/prestamos/, async (route) => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDbLoans }),
                });
            } else if (method === 'POST') {
                const payload = route.request().postDataJSON();
                const newLoan = {
                    id: String(mockDbLoans.length + 1),
                    item_name: payload.item_name,
                    status: 'Loaned',
                    loan_date: new Date().toISOString(),
                    due_date: payload.due_date,
                    member_id: payload.member_id,
                };
                mockDbLoans.push(newLoan);
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(newLoan),
                });
            } else if (method === 'PUT') {
                const urlObj = new URL(route.request().url());
                const id = urlObj.pathname.split('/').pop();
                const payload = route.request().postDataJSON();
                const index = mockDbLoans.findIndex(
                    (l) => String(l.id) === String(id),
                );

                if (index > -1) {
                    mockDbLoans[index] = { ...mockDbLoans[index], ...payload };
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ data: mockDbLoans[index] }),
                    });
                } else {
                    await route.fulfill({
                        status: 404,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: 'El préstamo solicitado no existe',
                        }),
                    });
                }
            } else if (method === 'DELETE') {
                const urlObj = new URL(route.request().url());
                const id = urlObj.pathname.split('/').pop();
                const index = mockDbLoans.findIndex(
                    (l) => String(l.id) === String(id),
                );

                if (index > -1) {
                    mockDbLoans.splice(index, 1);
                }
                // Idempotente: siempre 204, exista o no el préstamo
                await route.fulfill({ status: 204 });
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

        await page.route(/\/api\/v1\/socios/, async (route) => {
            const method = route.request().method();

            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDbMembers }),
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
    });

    test('debe crear un nuevo préstamo y mostrarlo en la lista', async ({
        page,
    }) => {
        await page.goto('/loans');
        await expect(
            page.getByText('No hay préstamos registrados.'),
        ).toBeVisible();

        await page.getByRole('button', { name: /Nuevo Préstamo/i }).click();
        await expect(page.getByText('Registrar nuevo préstamo')).toBeVisible();

        await page.getByText('Selecciona un socio').click();
        await page.getByText('Juan Pérez (12345678)').click();

        await page
            .getByPlaceholder('Ej. Pelota de fútbol')
            .fill('Pelota de básquet');
        await page.getByLabel(/Fecha de devolución/i).fill('2026-12-31');

        await page.getByRole('button', { name: /Crear Préstamo/i }).click();
        await expect(
            page.getByRole('button', { name: /Crear Préstamo/i }),
        ).toBeHidden();
        await expect(page.getByText('Pelota de básquet')).toBeVisible();
    });

    test('debe actualizar el estado del préstamo a Returned', async ({
        page,
    }) => {
        mockDbLoans.push({
            id: 'loan-1',
            item_name: 'Pelota de fútbol',
            status: 'Loaned',
            loan_date: new Date('2026-05-01').toISOString(),
            due_date: '2026-12-31T00:00:00.000Z',
            member_id: 'member-1',
        });

        await page.goto('/loans');

        await expect(page.getByText('Pelota de fútbol')).toBeVisible();
        await expect(page.getByText('Loaned')).toBeVisible();

        await page
            .getByRole('button', { name: /Editar estado del préstamo/i })
            .click();
        await expect(page.getByText('Actualizar Estado')).toBeVisible();

        await page.getByText('Selecciona el estado').click();
        await page.getByText('Devuelto (Returned)').click();

        await page.getByRole('button', { name: /Guardar Cambios/i }).click();
        await expect(
            page.getByRole('button', { name: /Guardar Cambios/i }),
        ).toBeHidden();

        await expect(page.getByText('Returned')).toBeVisible();
        await expect(page.getByText('Loaned')).toBeHidden();
    });

    test('debe eliminar el préstamo tras confirmar y mostrar el estado vacío', async ({
        page,
    }) => {
        mockDbLoans.push({
            id: 'loan-2',
            item_name: 'Pelota de básquet',
            status: 'Loaned',
            loan_date: new Date('2026-05-01').toISOString(),
            due_date: '2026-12-31T00:00:00.000Z',
            member_id: 'member-1',
        });

        await page.goto('/loans');

        // Verificamos que el préstamo existe antes de borrar
        await expect(page.getByText('Pelota de básquet')).toBeVisible();

        // Aceptamos automáticamente el confirm del navegador
        page.on('dialog', (dialog) => dialog.accept());

        // Click en el icono de eliminar (tacho de basura)
        await page.getByRole('button', { name: /Eliminar préstamo/i }).click();

        // Verificamos que el ítem desapareció y se muestra el estado vacío
        await expect(
            page.getByText('No hay préstamos registrados.'),
        ).toBeVisible();
        await expect(page.getByText('Pelota de básquet')).toBeHidden();
    });
});
