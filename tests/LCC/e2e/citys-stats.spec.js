const { test, expect } = require("@playwright/test");

const API_URL = "http://127.0.0.1:10000/api/v2/citys-stats";

async function resetCollection(request) {
  const deleteResponse = await request.delete(API_URL);
  expect(deleteResponse.status()).toBe(204);

  const loadResponse = await request.get(`${API_URL}/loadInitialData`);
  expect(loadResponse.status()).toBe(201);
}

test.beforeEach(async ({ request, page }) => {
  await resetCollection(request);
  await page.goto("/citys-stats");
});

test("la portada del grupo muestra correctamente la parte de LCC", async ({ page }) => {
  await page.goto("/");

  const lccCard = page.getByTestId("member-citys-stats");

  await expect(lccCard).toContainText("Luis Cortes Cobos");
  await expect(lccCard).toContainText("Recurso de la API: citys-stats");
  await expect(lccCard).toContainText("Fuente de datos asociada: citys-stats");
  await expect(lccCard.getByTestId("frontend-citys-stats")).toHaveAttribute("href", "/citys-stats");
  await expect(lccCard.getByTestId("api-v1-citys-stats")).toHaveAttribute("href", /\/api\/v1\/citys-stats$/);
  await expect(lccCard.getByTestId("api-v2-citys-stats")).toHaveAttribute("href", /\/api\/v2\/citys-stats$/);
  await expect(lccCard.getByTestId("docs-v1-citys-stats")).toHaveAttribute("href", /\/api\/v1\/citys-stats\/docs$/);
  await expect(lccCard.getByTestId("docs-v2-citys-stats")).toHaveAttribute("href", /\/api\/v2\/citys-stats\/docs$/);
});

test("lista los registros disponibles", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Estadisticas de ciudades" })).toBeVisible();
  await expect(page.getByTestId("row-tokyo-japan")).toBeVisible();
  await expect(page.getByTestId("results-summary")).toContainText("Registros visibles");
});

test("crea un nuevo registro desde el formulario", async ({ page }) => {
  await page.getByTestId("create-city").fill("malaga");
  await page.getByTestId("create-country").fill("spain");
  await page.getByTestId("create-population").fill("590000");
  await page.getByTestId("create-submit").click();

  await expect(page.getByTestId("feedback-success")).toContainText("Se ha creado el registro");
  await expect(page.getByTestId("row-malaga-spain")).toBeVisible();
});

test("borra un registro concreto", async ({ page }) => {
  await page.getByTestId("delete-tokyo-japan").click();

  await expect(page.getByTestId("feedback-success")).toContainText("Se ha eliminado tokyo (japan) correctamente.");
  await expect(page.getByTestId("row-tokyo-japan")).toHaveCount(0);
});

test("borra todos los registros", async ({ page }) => {
  await page.getByTestId("delete-all").click();

  await expect(page.getByTestId("feedback-success")).toContainText("Se han eliminado todos los registros.");
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("edita un registro en su vista separada", async ({ page }) => {
  await page.getByTestId("edit-tokyo-japan").click();

  await expect(page).toHaveURL(/\/citys-stats\/editar\/tokyo\/japan$/);
  await page.getByTestId("edit-population").fill("34000000");
  await page.getByTestId("edit-submit").click();
  await expect(page.getByTestId("edit-success")).toContainText("Los cambios se han guardado correctamente.");

  await page.getByRole("link", { name: "Volver al listado" }).click();
  await page.getByTestId("search-city").fill("tokyo");
  await page.getByTestId("apply-search").click();
  await expect(page.getByTestId("row-tokyo-japan")).toContainText("34000000");
});

test("busca con filtros, orden y limite", async ({ page }) => {
  await page.getByTestId("search-country").fill("china");
  await page.getByTestId("search-sort").selectOption("-un_2025_population");
  await page.getByTestId("search-limit").fill("1");
  await page.getByTestId("apply-search").click();

  await expect(page.getByTestId("feedback-success")).toContainText("Busqueda aplicada.");
  await expect(page.getByTestId("row-shanghai-china")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
