import { test, expect } from '@playwright/test';

// Cambia el puerto si tu servidor local usa otro distinto al 10000
const BASE_URL = 'http://localhost:10000/natural-disasters';

test.describe('E2E Tests para Natural Disasters (Alberto)', () => {

  test('1. Cargar la página y comprobar título', async ({ page }) => {
    await page.goto(BASE_URL);
    // Comprueba que el título h1 está visible
    await expect(page.locator('h1')).toContainText('Gestión de Desastres Naturales');
  });

  test('2. Listar todos los registros', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Pulsamos "Cargar Iniciales" por si la base de datos se quedó vacía en el test anterior
    await page.getByRole('button', { name: '📦 Cargar Iniciales' }).click();
    
    // Pulsamos el botón recargar para asegurar que carga la lista completa
    await page.getByRole('button', { name: '🔄 Recargar' }).click();
    
    // Verificamos que la tabla se muestra y tiene al menos una fila renderizada
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('3. Borrar un registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aceptamos la ventana de "confirm" de JavaScript automáticamente
    page.on('dialog', dialog => dialog.accept());

    // Buscamos el primer botón de borrar de la tabla y lo pulsamos
    const deleteButton = page.locator('.btn-danger-sm').first();
    await deleteButton.click();

    // Verificamos que sale el mensaje de eliminado
    await expect(page.locator('.mensaje.ok')).toContainText('eliminado');
  });


  test('4. Crear un nuevo registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Rellenamos el formulario
    await page.getByPlaceholder('País (ej: spain)').fill('TestLandia');
    await page.locator('.form-grid input[type="number"]').first().fill('2050'); 
    await page.getByPlaceholder('Nº Muertes', { exact: true }).fill('100');
    await page.getByPlaceholder('Nº Heridos', { exact: true }).fill('50');
    await page.getByPlaceholder('Daños economicos').fill('1000');

    // Hacemos clic en el botón de guardar
    await page.getByRole('button', { name: 'Guardar registro' }).click();

    // Verificamos que sale el mensaje verde de éxito
    await expect(page.locator('.mensaje.ok')).toContainText('creado correctamente');
  });
  

  test('5. Editar un registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Esperamos a que el primer botón de editar esté visible y lo pulsamos
    const editButton = page.locator('.btn-edit').first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verificamos que la URL ha cambiado y nos ha llevado a la vista separada de edición
    await expect(page).toHaveURL(/.*\/editar\/.*/);
  });

  

  test('6. Buscar un registro', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Rellenamos el buscador
    await page.getByPlaceholder('Buscar por país...').fill('TestLandia');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Verificamos que la tabla encuentra resultados
    await expect(page.locator('.mensaje.ok')).toContainText('Se han encontrado');
  });

  test('7. Borrar todos los registros', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aceptamos la alerta de confirmación ("¿Estás 100% seguro...?")
    page.on('dialog', dialog => dialog.accept());
    
    // Hacemos clic en el botón de borrar todos
    await page.getByRole('button', { name: '🗑️ Borrar Todos' }).click();
    
    // Verificamos que sale el mensaje de éxito que programaste
    await expect(page.locator('.mensaje.ok')).toContainText('pulverizados');
    
    // Verificamos que aparece el texto de que la tabla está vacía
    await expect(page.locator('.vacio')).toBeVisible();
  });

  

});