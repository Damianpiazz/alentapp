import { test, expect } from '@playwright/test';

//1- mostrar lockers existentes
//2- crear locker nuevo
//3- editar locker existente

test.describe('Lockers E2E (UI Integration)', () => {
    test.beforeEach(async ({ page }) => {
        // creo una base falsa en memoria para simular lockers
        const mockDb = [
            {
                id: '1',
                number: '101',
                location: 'Vestuario Masculino',
                status: 'Disponible',
                member_id: null,
                contract_finish_date: null,
            },
        ];

        // intercepto requests para no depender del backend real
        await page.route(/\/api\/v1\/lockers/, async (route) => {
            const method = route.request().method();

            // simulo obtener lockers
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDb }),
                });
            }

            // simulo crear locker y lo agrego a la bd falsa
            else if (method === 'POST') {
                const payload = route.request().postDataJSON();

                const newLocker = {
                    id: '2',
                    status: 'Disponible',
                    member_id: null,
                    ...payload,
                };

                mockDb.push(newLocker);

                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: newLocker }),
                });
            }

            // simulo actualización del locker
            else if (method === 'PUT') {
                const id = route.request().url().split('/').pop();

                const payload = route.request().postDataJSON();

                const index = mockDb.findIndex((l) => l.id === id);

                // actualizo el locker dentro de la bd simulada
                mockDb[index] = {
                    ...mockDb[index],
                    ...payload,
                };

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: mockDb[index] }),
                });
            } else {
                await route.continue();
            }
        });

        // entro a la pantalla de lockers antes de cada test
        await page.goto('/lockers');
    });

    test('debe mostrar lockers existentes', async ({ page }) => {
        // verifico que el locker falso cargó en pantalla
        await expect(page.getByText('101')).toBeVisible();

        // verifico que también aparezca el estado
        await expect(page.getByText('Disponible')).toBeVisible();
    });

    test('debe crear un locker nuevo', async ({ page }) => {
        // abro modal de creación
        await page.locator('button:has-text("Agregar Locker")').click();

        // verifico que abrió
        await expect(page.getByText('Agregar Nuevo Locker')).toBeVisible();

        // cargo número del locker
        await page.getByPlaceholder('Ej. 101').fill('200');

        // envío formulario
        await page
            .getByRole('button', {
                name: 'Crear Locker',
            })
            .click();

        // verifico que aparece en tabla
        await expect(page.getByText('200')).toBeVisible();
    });

    test('debe editar un locker', async ({ page }) => {
        // abro edición
        await page
            .getByRole('button', {
                name: /Editar/i,
            })
            .click();

        // verifico modal abierto
        await expect(page.getByText('Editar Locker')).toBeVisible();

        const input = page.getByPlaceholder('Ej. 101');

        // limpio y escribo nuevo número
        await input.clear();

        await input.fill('555');

        // guardo cambios
        await page
            .getByRole('button', {
                name: 'Actualizar Locker',
            })
            .click();

        // verifico que el cambio se refleje
        await expect(page.getByText('555')).toBeVisible();
    });
});
