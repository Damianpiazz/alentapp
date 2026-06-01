import { test, expect } from '@playwright/test';
/**
 * Tests E2E Full-Stack para la vista de Deportes.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5173
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */
test.describe('Sports Full-Stack E2E', () => {
    test('debe mostrar el estado vacío cuando no hay deportes en la DB', async ({
        page,
    }) => {
        await page.goto('/sports');
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible(
            { timeout: 10000 },
        );
    });
    test('debe crear un deporte real y mostrarlo en la tabla', async ({
        page,
    }) => {
        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();
        await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();
        await page.getByPlaceholder('Ej. Fútbol').fill('Basket E2E');
        await page
            .getByPlaceholder('Ej. Deporte colectivo de 11 jugadores')
            .fill('Deporte de canasta E2E');
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(
            page.getByRole('button', { name: 'Crear Deporte' }),
        ).toBeHidden();
        await expect(page.getByText('Basket E2E')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('Deporte de canasta E2E')).toBeVisible();
    });
});
