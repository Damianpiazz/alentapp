import { test, expect } from '@playwright/test';

test.describe('Disciplines Full-Stack E2E', () => {
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
        // ── 1. Crear socio ──
        await page.goto('/members', { waitUntil: 'networkidle' });

        await page.locator('button:has-text("Agregar Miembro")').click();
        await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();

        await page
            .getByPlaceholder('Ej. Juan Pérez')
            .fill('Socio Para Discipline E2E');
        await page.getByPlaceholder('Ej. 12345678').fill('99988877');
        await page
            .getByPlaceholder('ejemplo@correo.com')
            .fill('discipline@e2e.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');

        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(
            page.getByRole('button', { name: 'Crear Miembro' }),
        ).toBeHidden();
        await expect(page.getByText('Socio Para Discipline E2E')).toBeVisible({
            timeout: 10000,
        });

        // ── 2. Crear sanción ──
        await page.goto('/disciplines', { waitUntil: 'networkidle' });

        await page.locator('button:has-text("Nueva Sanción")').click();
        await expect(
            page.getByText('Nueva Sanción Disciplinaria'),
        ).toBeVisible();

        // Esperar que el select se pueble (evaluar length en el DOM, no visibilidad)
        const memberSelect = page.locator('select');
        await memberSelect.waitFor({ state: 'visible' });
        await expect(memberSelect).toBeVisible();
        await page.waitForFunction(
            () => (document.querySelector('select')?.options.length ?? 0) > 1,
            { timeout: 10000 },
        );

        await memberSelect.selectOption({ index: 1 });

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
        await page.goto('/disciplines', { waitUntil: 'networkidle' });

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
        await page.goto('/disciplines', { waitUntil: 'networkidle' });

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
