// Importamos defineConfig para escribir la configuracion de Vite con ayuda del editor.
import { defineConfig } from "vite";
// Importamos el plugin que permite compilar componentes Svelte.
import { svelte } from "@sveltejs/vite-plugin-svelte";
// Importamos utilidades de Node para crear alias de rutas estables.
import { fileURLToPath, URL } from "node:url";

// Exportamos la configuracion que usa Vite al compilar el frontend.
export default defineConfig({
  // Activamos Svelte dentro de Vite.
  plugins: [svelte()],
  resolve: {
    // Permite importar desde src con @/ aunque la pagina este en una carpeta anidada.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  // Configuracion de build, es decir, cuando se genera la version final.
  build: {
    // Guardamos el frontend compilado en ../public para que Express lo sirva.
    outDir: "../public",
    // Vaciamos public antes de compilar para no dejar archivos antiguos.
    emptyOutDir: true
  }
});
