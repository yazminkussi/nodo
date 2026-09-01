import { test, expect } from '@playwright/test';

test.describe('arranque de la app', () => {
  test('muestra la pantalla de ingreso', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'nodo' })).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /explorar en modo demo/i })).toBeVisible();
  });

  test('el modo demo abre la app con el portal del socio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /explorar en modo demo/i }).click();

    // Portal del socio: carnet digital con datos del socio demo
    await expect(page.getByRole('heading', { name: /carnet digital/i })).toBeVisible();
    await expect(page.getByText('Julieta Méndez')).toBeVisible();
    await expect(page.getByText(/socio n° 0142/i)).toBeVisible();
  });

  test('se puede pasar al panel de administración', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /explorar en modo demo/i }).click();
    await page.getByRole('tab', { name: /vista administración/i }).click();

    await expect(page.getByRole('heading', { name: /panel de administración/i })).toBeVisible();
    await expect(page.getByText(/socios activos/i)).toBeVisible();
  });
});
