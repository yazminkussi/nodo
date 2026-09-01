import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /explorar en modo demo/i }).click();
  await page.getByRole('tab', { name: /vista administración/i }).click();
  await expect(page.getByRole('heading', { name: /panel de administración/i })).toBeVisible();
});

test('la gestión de socios lista a los socios demo', async ({ page }) => {
  await page.getByRole('button', { name: /^socios$/i }).click();
  await expect(page.getByRole('heading', { name: /gestión de socios/i })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Carlos Kussi')).toBeVisible();
  await expect(page.getByRole('button', { name: /alta de socio/i })).toBeVisible();
});

test('la sección de control de acceso se abre', async ({ page }) => {
  await page.getByRole('button', { name: /escanear/i }).click();
  await expect(page.getByRole('heading', { name: /control de acceso|escanear/i }).first()).toBeVisible();
});

test('el filtro de socios por estado funciona', async ({ page }) => {
  await page.getByRole('button', { name: /^socios$/i }).click();
  await page.getByRole('button', { name: /^adeudan$/i }).click();
  // Diego Correa está moroso en el seed demo
  await expect(page.getByText('Diego Correa')).toBeVisible();
});
