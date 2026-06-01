import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('Equipment Loan Full-Stack E2E', () => {
    test('debe crear un préstamo real y mostrarlo en la lista', async ({
        page,
    }) => {
        const memberRes = await fetch(`${API_URL}/api/v1/socios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dni: '11111111',
                name: 'Test E2E Equipment',
                email: 'equipment@e2e.com',
                birthdate: '1990-05-15',
            }),
        });
        expect(memberRes.status).toBe(201);

        await page.goto('/loans');
        await expect(
            page.getByText('No hay préstamos registrados.'),
        ).toBeVisible({ timeout: 10000 });

        await page.getByRole('button', { name: /Nuevo Préstamo/i }).click();
        await expect(page.getByText('Registrar nuevo préstamo')).toBeVisible();

        await page.getByText('Selecciona un socio').click();
        await page.getByText('Test E2E Equipment (11111111)').click();

        await page
            .getByPlaceholder('Ej. Pelota de fútbol')
            .fill('Raqueta de tenis');
        await page.getByLabel(/Fecha de devolución/i).fill('2026-12-31');

        await page.getByRole('button', { name: /Crear Préstamo/i }).click();
        await expect(
            page.getByRole('button', { name: /Crear Préstamo/i }),
        ).toBeHidden();
        await expect(page.getByText('Raqueta de tenis')).toBeVisible({
            timeout: 10000,
        });
    });

    test('debe actualizar el estado del préstamo a Returned', async ({
        page,
    }) => {
        await page.goto('/loans');

        await expect(page.getByText('Raqueta de tenis')).toBeVisible({
            timeout: 10000,
        });
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

        await expect(page.getByText('Returned')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('Loaned')).toBeHidden();
    });

    test('debe eliminar el préstamo tras confirmar y mostrar el estado vacío', async ({
        page,
    }) => {
        await page.goto('/loans');

        // El préstamo de tests anteriores persiste en la DB
        await expect(page.getByText('Raqueta de tenis')).toBeVisible({
            timeout: 10000,
        });

        // Aceptamos el confirm del navegador automáticamente
        page.on('dialog', (dialog) => dialog.accept());

        // Click en eliminar
        await page.getByRole('button', { name: /Eliminar préstamo/i }).click();

        // La lista debería quedar vacía
        await expect(
            page.getByText('No hay préstamos registrados.'),
        ).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Raqueta de tenis')).toBeHidden();
    });
});
