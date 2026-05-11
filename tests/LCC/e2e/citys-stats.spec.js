// Importamos las utilidades de Playwright:
// - test define cada prueba E2E.
// - expect permite comprobar que la pantalla o la API tienen el estado esperado.
const { test, expect } = require("@playwright/test");

// URL directa de la API v2 de LCC en local.
// Los tests la usan para preparar datos antes de abrir la interfaz.
const API_URL = "http://127.0.0.1:10000/api/v2/citys-stats";

// Deja la coleccion en un estado conocido antes de cada test.
// Esto evita que una prueba dependa de datos creados o borrados por otra.
async function resetCollection(request) {
  // Primero borra toda la coleccion con DELETE /api/v2/citys-stats.
  const deleteResponse = await request.delete(API_URL);
  // La API debe responder 204 porque borrar todos no devuelve cuerpo.
  expect(deleteResponse.status()).toBe(204);

  // Despues carga los datos iniciales de ejemplo.
  const loadResponse = await request.get(`${API_URL}/loadInitialData`);
  // Como acabamos de borrar, loadInitialData debe insertar y devolver 201.
  expect(loadResponse.status()).toBe(201);
}

// beforeEach se ejecuta antes de cada prueba.
// request permite llamar a la API sin pasar por la interfaz.
// page representa el navegador real que vera el usuario.
test.beforeEach(async ({ request, page }) => {
  // Reiniciamos la base de datos de LCC para partir siempre del mismo estado.
  await resetCollection(request);
  // Abrimos la pantalla CRUD principal de citys-stats.
  await page.goto("/citys-stats");
});

// Comprueba que la portada del grupo enlaza correctamente la parte de LCC.
test("la portada del grupo muestra correctamente la parte de LCC", async ({ page }) => {
  // Vamos a la home de la aplicacion.
  await page.goto("/");

  // Localizamos la tarjeta de LCC usando el data-testid estable.
  const lccCard = page.getByTestId("member-citys-stats");

  // Verificamos textos visibles de autoria y recurso.
  await expect(lccCard).toContainText("Luis Cortes Cobos");
  await expect(lccCard).toContainText("Recurso de la API: citys-stats");
  await expect(lccCard).toContainText("Fuente de datos asociada: citys-stats");
  // Verificamos que el enlace al frontend apunta a /citys-stats.
  await expect(lccCard.getByTestId("frontend-citys-stats")).toHaveAttribute("href", "/citys-stats");
  // Verificamos enlaces a APIs v1 y v2.
  await expect(lccCard.getByTestId("api-v1-citys-stats")).toHaveAttribute("href", /\/api\/v1\/citys-stats$/);
  await expect(lccCard.getByTestId("api-v2-citys-stats")).toHaveAttribute("href", /\/api\/v2\/citys-stats$/);
  // Verificamos enlaces a documentacion Postman v1 y v2.
  await expect(lccCard.getByTestId("docs-v1-citys-stats")).toHaveAttribute("href", /\/api\/v1\/citys-stats\/docs$/);
  await expect(lccCard.getByTestId("docs-v2-citys-stats")).toHaveAttribute("href", /\/api\/v2\/citys-stats\/docs$/);
});

// Comprueba que la tabla se carga con datos iniciales.
test("lista los registros disponibles", async ({ page }) => {
  // Debe aparecer el titulo de la pantalla CRUD.
  await expect(page.getByRole("heading", { name: "Estadisticas de ciudades" })).toBeVisible();
  // Tokyo debe aparecer porque forma parte de initialData.
  await expect(page.getByTestId("row-tokyo-japan")).toBeVisible();
  // La tarjeta resumen debe indicar que hay registros visibles.
  await expect(page.getByTestId("results-summary")).toContainText("Registros visibles");
});

// Comprueba el flujo real de creacion desde la interfaz.
test("crea un nuevo registro desde el formulario", async ({ page }) => {
  // Rellenamos los tres campos obligatorios del formulario.
  await page.getByTestId("create-city").fill("malaga");
  await page.getByTestId("create-country").fill("spain");
  await page.getByTestId("create-population").fill("590000");
  // Enviamos el formulario; internamente debe hacer POST /api/v2/citys-stats.
  await page.getByTestId("create-submit").click();

  // La interfaz debe mostrar mensaje de exito.
  await expect(page.getByTestId("feedback-success")).toContainText("Se ha creado el registro");
  // El nuevo registro debe aparecer en la tabla.
  await expect(page.getByTestId("row-malaga-spain")).toBeVisible();
});

// Comprueba el flujo de borrado de un registro concreto.
test("borra un registro concreto", async ({ page }) => {
  // Pulsamos eliminar en la fila tokyo/japan.
  // Internamente debe hacer DELETE /api/v2/citys-stats/tokyo/japan.
  await page.getByTestId("delete-tokyo-japan").click();

  // La pantalla debe confirmar el borrado.
  await expect(page.getByTestId("feedback-success")).toContainText("Se ha eliminado tokyo (japan) correctamente.");
  // La fila ya no debe existir en el DOM.
  await expect(page.getByTestId("row-tokyo-japan")).toHaveCount(0);
});

// Comprueba el borrado completo de la coleccion desde la interfaz.
test("borra todos los registros", async ({ page }) => {
  // Pulsamos el boton que llama a DELETE /api/v2/citys-stats.
  await page.getByTestId("delete-all").click();

  // Debe aparecer confirmacion de exito.
  await expect(page.getByTestId("feedback-success")).toContainText("Se han eliminado todos los registros.");
  // Al no quedar datos, debe verse el estado vacio.
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

// Comprueba el flujo de edicion en la pantalla separada.
test("edita un registro en su vista separada", async ({ page }) => {
  // Abrimos la vista de edicion de tokyo/japan desde la tabla.
  await page.getByTestId("edit-tokyo-japan").click();

  // La URL debe contener la clave del recurso: city + country.
  await expect(page).toHaveURL(/\/citys-stats\/editar\/tokyo\/japan$/);
  // Cambiamos solo la poblacion para que sea un PUT normal del mismo recurso.
  await page.getByTestId("edit-population").fill("34000000");
  // Guardar cambios debe llamar a PUT /api/v2/citys-stats/tokyo/japan.
  await page.getByTestId("edit-submit").click();
  // La pantalla debe confirmar que el backend acepto el cambio.
  await expect(page.getByTestId("edit-success")).toContainText("Los cambios se han guardado correctamente.");

  // Volvemos al listado para comprobar visualmente el dato actualizado.
  await page.getByRole("link", { name: "Volver al listado" }).click();
  // Buscamos tokyo para aislar el registro en la tabla.
  await page.getByTestId("search-city").fill("tokyo");
  // Enviamos busqueda, que llama a GET /api/v2/citys-stats?city=tokyo.
  await page.getByTestId("apply-search").click();
  // La fila debe contener la nueva poblacion.
  await expect(page.getByTestId("row-tokyo-japan")).toContainText("34000000");
});

// Comprueba filtros, ordenacion y paginacion desde la UI.
test("busca con filtros, orden y limite", async ({ page }) => {
  // Filtramos por pais exacto.
  await page.getByTestId("search-country").fill("china");
  // Pedimos orden descendente por poblacion.
  await page.getByTestId("search-sort").selectOption("-un_2025_population");
  // Limitamos a un unico resultado.
  await page.getByTestId("search-limit").fill("1");
  // Enviamos la busqueda; debe construir query params para la API.
  await page.getByTestId("apply-search").click();

  // La interfaz confirma que ha aplicado la busqueda.
  await expect(page.getByTestId("feedback-success")).toContainText("Busqueda aplicada.");
  // Shanghai debe ser la ciudad china con mas poblacion del dataset inicial.
  await expect(page.getByTestId("row-shanghai-china")).toBeVisible();
  // Como limit=1, solo debe mostrarse una fila.
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
