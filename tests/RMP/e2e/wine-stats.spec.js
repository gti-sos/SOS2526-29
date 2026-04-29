const { test, expect } = require("@playwright/test");

test.describe("Wine Stats - Frontend", () => {
  test.describe.configure({ mode: "serial" });

  test("Borrar todos los vinos", async ({ page }) => {
    await page.goto("/wine-stats");
    page.on("dialog", dialog => dialog.accept());
    await page.click("button.btn-danger");
    await expect(page.locator(".mensaje.ok")).toBeVisible();
  });

  test("Cargar datos iniciales", async ({ page }) => {
    await page.goto("/wine-stats");
    await page.click("button.btn-init");
    await expect(page.locator(".mensaje.ok")).toBeVisible();
  });

  test("Listar todos los vinos", async ({ page }) => {
    await page.goto("/wine-stats");
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("Crear un nuevo vino", async ({ page }) => {
    await page.goto("/wine-stats");
    await page.click("text=Añadir vino");
    await page.fill('input[placeholder="Nombre del vino"]', "Test Wine");
    await page.fill('input[placeholder="spain, france..."]', "spain");
    await page.fill('input[placeholder="Rioja, Penedès..."]', "rioja");
    await page.locator('label:has-text("Año") input').fill("2020");
    await page.locator('label:has-text("Precio") input').fill("12.99");
    await page.locator('label:has-text("Graduación") input').fill("14");
    await page.locator('label:has-text("Unidades") input').fill("10");
    await page.fill('input[placeholder="Tempranillo..."]', "Tempranillo");
    await page.fill('input[placeholder="Red, White, Rosé..."]', "Red");
    await page.locator('label:has-text("Capacidad") input').fill("75");
    await page.click("text=Guardar vino");
    await expect(page.locator(".mensaje.ok")).toBeVisible();
  });

  test("Editar un vino", async ({ page }) => {
    await page.goto("/wine-stats");
    await page.locator("button.btn-edit").first().click();
    await expect(page).toHaveURL(/\/wine-stats\/editar\/\d+/);
    await page.locator('label:has-text("Precio") input').fill("19.99");
    await page.click("text=Guardar cambios");
    await expect(page.locator(".mensaje.ok")).toBeVisible();
  });

  test("Borrar un vino concreto", async ({ page }) => {
    await page.goto("/wine-stats");
    page.on("dialog", dialog => dialog.accept());
    await page.locator("button.btn-danger-sm").first().click();
    await expect(page.locator(".mensaje.ok")).toBeVisible();
  });
});
