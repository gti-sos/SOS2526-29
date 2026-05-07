// Indicamos el tipo de configuracion para que el editor entienda este archivo.
/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
// Ocultamos avisos de CSS no usado en el editor. En este proyecto hay paginas
// con estilos compartidos o preparados para bloques condicionales, y Svelte los
// pinta como problemas aunque la aplicacion compile correctamente.
export default {
  compilerOptions: {
    warningFilter: (warning) => warning.code !== "css_unused_selector"
  }
};
