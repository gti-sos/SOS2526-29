

import { test, expect } from '@playwright/test';

// Cambia el puerto si tu servidor local usa otro distinto al 10000
const BASE_URL = 'http://localhost:10000/#/natural-disasters';

test.describe('E2E Tests para Natural Disasters (Alberto)', () => {

  test('1. Cargar la página y comprobar título', async ({ page }) => {
    await page.goto(BASE_URL);
    // Comprueba que el título h1 está visible
    await expect(page.locator('h1')).toContainText('Gestión de Desastres Naturales');
  });

  test('2. Crear un nuevo registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Rellenamos el formulario usando los placeholders que pusiste en el HTML
    await page.getByPlaceholder('País (ej: spain)').fill('TestLandia');
    await page.locator('.form-grid input[type="number"]').first().fill('2050'); // El primer input de año
    await page.getByPlaceholder('Nº Muertes').fill('100');
    await page.getByPlaceholder('Nº Heridos').fill('50');
    await page.getByPlaceholder('Daños economicos').fill('1000');

    // Hacemos clic en el botón de guardar
    await page.getByRole('button', { name: 'Guardar registro' }).click();

    // Verificamos que sale el mensaje verde de éxito
    await expect(page.locator('.mensaje.ok')).toContainText('creado correctamente');
  });

  test('3. Buscar un registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Rellenamos el buscador
    await page.getByPlaceholder('Buscar por país...').fill('TestLandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Verificamos que la tabla encuentra resultados
    await expect(page.locator('.mensaje.ok')).toContainText('Se han encontrado');
  });

  test('4. Borrar un registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Playwright necesita que le digamos que acepte la ventana de "confirm" de JavaScript automáticamente
    page.on('dialog', dialog => dialog.accept());

    // Buscamos el primer botón de borrar de la tabla y lo pulsamos
    const deleteButton = page.locator('.btn-danger-sm').first();
    await deleteButton.click();

    // Verificamos que sale el mensaje de eliminado
    await expect(page.locator('.mensaje.ok')).toContainText('eliminado');
  });

});