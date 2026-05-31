import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Disciplina.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5173
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */
test.describe('Disciplines Full-Stack E2E', () => {
    test('debe mostrar el estado vacío cuando no hay sanciones en la DB', async ({
        page,
    }) => {
        await page.goto('/disciplines');
        await expect(
            page.getByText('No se encontraron sanciones.'),
        ).toBeVisible({ timeout: 10000 });
    });

    test('debe crear una sanción real y mostrarla en la tabla', async ({
        page,
    }) => {
        await page.goto('/disciplines');

        await page.locator('button:has-text("Nueva Sanción")').click();
        await expect(
            page.getByText('Nueva Sanción Disciplinaria'),
        ).toBeVisible();

        await page.locator('select').selectOption({ index: 1 });
        await page
            .getByPlaceholder('Describe el motivo de la sanción')
            .fill('Conducta inapropiada E2E Fullstack');
        await page.locator('input[type="date"]').first().fill('2026-05-01');
        await page.locator('input[type="date"]').last().fill('2026-06-01');

        await page.getByRole('button', { name: 'Crear Sanción' }).click();

        await expect(
            page.getByRole('button', { name: 'Crear Sanción' }),
        ).toBeHidden();
        await expect(
            page.getByText('Conducta inapropiada E2E Fullstack'),
        ).toBeVisible({ timeout: 10000 });
    });

    test('debe editar la sanción creada y ver el cambio en la tabla', async ({
        page,
    }) => {
        await page.goto('/disciplines');

        await expect(
            page.getByText('Conducta inapropiada E2E Fullstack'),
        ).toBeVisible({ timeout: 10000 });

        await page
            .getByRole('button', { name: /Editar sanción/i })
            .first()
            .click();
        await expect(page.getByText('Editar Sanción')).toBeVisible();

        await page
            .getByPlaceholder('Describe el motivo de la sanción')
            .fill('Conducta inapropiada E2E Fullstack Editada');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(
            page.getByRole('button', { name: 'Guardar Cambios' }),
        ).toBeHidden();

        await expect(
            page.getByText('Conducta inapropiada E2E Fullstack Editada'),
        ).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText('Conducta inapropiada E2E Fullstack', {
                exact: true,
            }),
        ).toBeHidden();
    });

    test('debe eliminar la sanción y mostrar el estado vacío', async ({
        page,
    }) => {
        await page.goto('/disciplines');

        await expect(
            page.getByText('Conducta inapropiada E2E Fullstack Editada'),
        ).toBeVisible({ timeout: 10000 });

        page.on('dialog', (dialog) => dialog.accept());

        await page
            .getByRole('button', { name: /Eliminar sanción/i })
            .first()
            .click();

        await expect(
            page.getByText('No se encontraron sanciones.'),
        ).toBeVisible({ timeout: 10000 });
    });
});
