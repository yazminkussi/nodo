import { test, expect } from '@playwright/test';

test('un socio se inscribe y se da de baja de un taller', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /explorar en modo demo/i }).click();

  await page.getByRole('button', { name: /^talleres$/i }).click();
  await expect(page.getByRole('heading', { name: /talleres y actividades/i })).toBeVisible();

  // Primer taller con cupo disponible
  const inscribirme = page.getByRole('button', { name: /^inscribirme$/i }).first();
  await inscribirme.click();
  await expect(page.getByText(/inscripción confirmada/i)).toBeVisible();

  // La tarjeta pasa a estado inscripto: el botón ahora ofrece darse de baja
  const desinscribirme = page.getByRole('button', { name: /desinscribirme/i }).first();
  await expect(desinscribirme).toBeVisible();
  await expect(page.getByRole('heading', { name: /mis inscripciones/i })).toBeVisible();

  // Baja desde la tarjeta
  await desinscribirme.click();
  await expect(page.getByText(/te desinscribiste/i)).toBeVisible();
});
