import { test, expect } from '@playwright/test';

test('un socio reserva un espacio', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /explorar en modo demo/i }).click();

  // Portal del socio → sección Reservas
  await page.getByRole('button', { name: /^reservas$/i }).click();
  await expect(page.getByRole('heading', { name: /reservá tu espacio/i })).toBeVisible();

  // Abrir el primer espacio disponible
  await page.getByText('Reservar ahora').first().click();

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.getByText(/reservar ·/i)).toBeVisible();

  // Elegir un día futuro (el último de la grilla, sin turnos pasados)
  await modal.getByTestId('dia-reserva').last().click();

  // Primer turno libre
  await modal.getByTestId('slot-reserva').and(page.locator(':not([disabled])')).first().click();

  await modal.getByRole('button', { name: /confirmar reserva/i }).click();

  await expect(modal.getByText(/reserva confirmada/i)).toBeVisible();
  await expect(modal.getByText(/pase de ingreso digital/i)).toBeVisible();
});
