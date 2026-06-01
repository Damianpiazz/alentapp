import { test, expect, Page } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Pagos.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup limpia la DB antes de correr.

 */

async function gotoPayments(page: Page) {
    await page.goto('/payments', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Administración de Pagos')).toBeVisible({
        timeout: 15000,
    });
    await expect(page.getByText('Cargando pagos...')).toBeHidden({
        timeout: 15000,
    });
}

async function selectFirstMember(page: Page) {
    const trigger = page
        .locator('[data-scope="select"][data-part="trigger"]')
        .filter({ hasText: 'Seleccione un socio' });
    await trigger.click({ force: true });

    const listbox = page.locator(
        '[data-scope="select"][data-part="content"][data-state="open"]',
    );
    await expect(listbox).toBeVisible({ timeout: 10000 });

    await listbox.locator('[data-part="item"]').first().click({ force: true });
}

test.describe('Payments Full-Stack E2E', () => {
    //no test test0 a
    test('debe crear un socio para usar en los tests de pagos', async ({
        page,
    }) => {
        await page.goto('/members', { waitUntil: 'domcontentloaded' });
        await expect(
            page.locator('button:has-text("Agregar Miembro")'),
        ).toBeVisible({ timeout: 15000 });

        await page.locator('button:has-text("Agregar Miembro")').click();
        await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();

        await page
            .getByPlaceholder('Ej. Juan Pérez')
            .fill('Socio Para Pagos E2E');
        await page.getByPlaceholder('Ej. 12345678').fill('11122233');
        await page.getByPlaceholder('ejemplo@correo.com').fill('pagos@e2e.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-15');

        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(
            page.getByRole('button', { name: 'Crear Miembro' }),
        ).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('Socio Para Pagos E2E')).toBeVisible({
            timeout: 10000,
        });
    });

    // TDD-0013 Alta de Pago

    //test1
    test('debe mostrar el estado vacío cuando no hay pagos en la DB', async ({
        page,
    }) => {
        await gotoPayments(page);
        await expect(page.getByText('No se encontraron pagos.')).toBeVisible({
            timeout: 10000,
        });
    });

    //test2
    test('debe crear un pago real y mostrarlo en la tabla con estado Pending', async ({
        page,
    }) => {
        await gotoPayments(page);

        await page.locator('button:has-text("Generar Pago")').click();
        await expect(page.getByText('Generar Nuevo Pago')).toBeVisible();

        await selectFirstMember(page);

        await page.getByPlaceholder('Ej. 1500.50').fill('5000');
        await page.locator('input[type="date"]').fill('2026-06-30');

        await page.locator('button[type="submit"]').click();

        await expect(
            page.getByText('Pago registrado correctamente'),
        ).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Pending')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('$5000')).toBeVisible({ timeout: 10000 });
    });

    //test3
    test('debe rechazar la creación de un pago con monto igual a cero', async ({
        page,
    }) => {
        await gotoPayments(page);

        await page.locator('button:has-text("Generar Pago")').click();
        await expect(page.getByText('Generar Nuevo Pago')).toBeVisible();

        await selectFirstMember(page);

        await page.getByPlaceholder('Ej. 1500.50').fill('0');
        await page.locator('input[type="date"]').fill('2026-06-30');

        await page.locator('button[type="submit"]').click();

        await expect(page.getByText('Generar Nuevo Pago')).toBeVisible({
            timeout: 5000,
        });
        await expect(
            page.getByText('Pago registrado correctamente'),
        ).toBeHidden();
    });

    // TDD-0014 Actualización de Pagos

    //test4
    test('debe marcar un pago como Paid y ver el cambio de estado en la tabla', async ({
        page,
    }) => {
        await gotoPayments(page);
        await expect(page.getByText('Pending')).toBeVisible({ timeout: 10000 });

        await page
            .getByRole('button', { name: /Editar pago/i })
            .first()
            .click();
        await expect(page.getByText('Editar Pago')).toBeVisible();

        // Abrir el select de Estado
        const estadoTrigger = page
            .locator('[data-scope="select"][data-part="trigger"]')
            .filter({ hasText: /Pending|Pendiente/ });
        await estadoTrigger.click({ force: true });

        const statusListbox = page.locator(
            '[data-scope="select"][data-part="content"][data-state="open"]',
        );
        await expect(statusListbox).toBeVisible({ timeout: 10000 });
        await statusListbox
            .locator('[data-part="item"]')
            .filter({ hasText: 'Pagado' })
            .click({ force: true });

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(
            page.getByRole('button', { name: 'Guardar Cambios' }),
        ).toBeHidden({ timeout: 10000 });

        await expect(
            page.getByText('Pago actualizado correctamente'),
        ).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Paid')).toBeVisible({ timeout: 10000 });
    });

    //test5
    test('debe rechazar actualizar un pago que ya está en estado Paid', async ({
        page,
    }) => {
        await gotoPayments(page);
        await expect(page.getByText('Paid')).toBeVisible({ timeout: 10000 });

        await page
            .getByRole('button', { name: /Editar pago/i })
            .first()
            .click();
        await expect(page.getByText('Editar Pago')).toBeVisible();

        // Abrir el select de Estado (muestra Paid/Pagado)
        const estadoTrigger2 = page
            .locator('[data-scope="select"][data-part="trigger"]')
            .filter({ hasText: /Paid|Pagado/ });
        await estadoTrigger2.click({ force: true });

        const statusListbox2 = page.locator(
            '[data-scope="select"][data-part="content"][data-state="open"]',
        );
        await expect(statusListbox2).toBeVisible({ timeout: 10000 });
        await statusListbox2
            .locator('[data-part="item"]')
            .filter({ hasText: 'Cancelado' })
            .click({ force: true });

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // La API rechaza con 409
        await expect(
            page.getByText('El pago ya se encuentra procesado'),
        ).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Editar Pago')).toBeVisible();
    });

    // TDD-0015 Anulación de Pagos Delete Lógico

    //test6
    test('debe crear un segundo pago Pending y anularlo exitosamente', async ({
        page,
    }) => {
        await gotoPayments(page);

        await page.locator('button:has-text("Generar Pago")').click();
        await expect(page.getByText('Generar Nuevo Pago')).toBeVisible();

        await selectFirstMember(page);
        await page.getByPlaceholder('Ej. 1500.50').fill('2500');
        await page.locator('input[type="date"]').fill('2026-07-31');
        await page.locator('button[type="submit"]').click();

        await expect(
            page.getByText('Pago registrado correctamente'),
        ).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('$2500')).toBeVisible({ timeout: 10000 });

        page.on('dialog', (dialog) => dialog.accept());

        const anularBtn = page
            .getByRole('button', { name: /Anular pago/i })
            .locator(':not([disabled])');
        await anularBtn.first().click();

        await expect(page.getByText('Pago anulado exitosamente')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('$2500')).toBeHidden({ timeout: 10000 });
    });

    //test7
    test('no debe permitir anular un pago en estado Paid (botón deshabilitado)', async ({
        page,
    }) => {
        await gotoPayments(page);
        await expect(page.getByText('Paid')).toBeVisible({ timeout: 10000 });

        const paidRow = page.locator('tr').filter({ hasText: 'Paid' }).first();
        const anularBtn = paidRow.locator('[aria-label="Anular pago"]');
        await expect(anularBtn).toBeDisabled({ timeout: 10000 });
    });
});
