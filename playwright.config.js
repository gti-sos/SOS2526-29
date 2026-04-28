// Importamos helpers de Playwright para configurar pruebas e2e.
const { defineConfig, devices } = require("@playwright/test");

// Exportamos la configuracion que Playwright usa al ejecutar las pruebas.
module.exports = defineConfig({
  // Carpeta donde se encuentran las pruebas.
  testDir: "./tests",
  // Ejecutamos en serie para evitar conflictos con la misma base de datos.
  fullyParallel: false,
  // En CI no permitimos pruebas marcadas con .only.
  forbidOnly: !!process.env.CI,
  // En CI reintentamos dos veces si hay fallos intermitentes.
  retries: process.env.CI ? 2 : 0,
  // Usamos un solo worker porque el backend comparte datos locales.
  workers: 1,
  // Generamos informe HTML.
  reporter: "html",
  // Opciones comunes para todas las pruebas.
  use: {
    // URL base donde Playwright espera encontrar la app.
    baseURL: "http://127.0.0.1:10000",
    // Guardamos traza solo cuando se reintenta una prueba.
    trace: "on-first-retry"
  },
  // Navegador usado en las pruebas.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  // Servidor que se arranca automaticamente para las pruebas.
  webServer: {
    command: "node index.js",
    url: "http://127.0.0.1:10000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
