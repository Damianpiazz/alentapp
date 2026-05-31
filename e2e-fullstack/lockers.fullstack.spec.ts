import { test, expect } from '@playwright/test';

/*1- Valida que la pantalla cargue correctamente y que no existan lockers cargados inicialmente.

2- Crea un locker real desde la interfaz y verifica que aparezca correctamente en la tabla.

3- Crea un locker, lo edita mediante la interfaz y valida que el cambio persista correctamente.
*/

test.describe('Lockers Full-Stack E2E', () => {
    test('debe mostrar estado vacío cuando no existen lockers', async ({
        page,
    }) => {
        await page.goto(
            '/lockers',

            {
                waitUntil: 'networkidle',
            },
        );

        // verifico que cargó la pantalla
        await expect(page.getByText('Administración de Lockers')).toBeVisible({
            timeout: 10000,
        });

        // verifico tabla vacía
        await expect(page.locator('tbody tr')).toHaveCount(0);
    });

    test('debe crear un locker real y mostrarlo en tabla', async ({ page }) => {
        await page.goto(
            '/lockers',

            {
                waitUntil: 'networkidle',
            },
        );

        // abrir modal
        await page

            .locator('button:has-text("Agregar Locker")')

            .click();

        await expect(page.getByText('Agregar Nuevo Locker')).toBeVisible();

        // completar formulario
        await page

            .getByPlaceholder('Ej. 101')

            .fill('777');

        // guardar
        await page

            .getByRole(
                'button',

                {
                    name: 'Crear Locker',
                },
            )

            .click();

        // verificar persistencia real
        await expect(page.getByText('777')).toBeVisible({
            timeout: 10000,
        });
    });

    test('debe editar locker existente', async ({ page }) => {
        await page.goto(
            '/lockers',

            {
                waitUntil: 'networkidle',
            },
        );

        // creo locker específico para este test
        await page

            .locator('button:has-text("Agregar Locker")')

            .click();

        await page

            .getByPlaceholder('Ej. 101')

            .fill('333');

        await page

            .getByRole(
                'button',

                {
                    name: 'Crear Locker',
                },
            )

            .click();

        // verifico creación
        await expect(page.getByText('333')).toBeVisible({
            timeout: 10000,
        });

        // editar
        await page

            .getByRole(
                'button',

                {
                    name: /Editar/i,
                },
            )

            .first()

            .click();

        const input = page.getByPlaceholder('Ej. 101');

        await input.clear();

        await input.fill('888');

        // guardar actualización
        await page

            .getByRole(
                'button',

                {
                    name: 'Actualizar Locker',
                },
            )

            .click();

        // validar persistencia
        await expect(page.getByText('888')).toBeVisible({
            timeout: 10000,
        });
    });
});
