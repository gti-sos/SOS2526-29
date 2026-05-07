/**
 * Punto comun para construir URLs del backend.
 *
 * En desarrollo la app Svelte se sirve con Vite, pero la API real vive en
 * Express en el puerto 10000. En produccion frontend y backend comparten
 * origen, por eso se usa window.location.origin.
 */
export const API_ORIGIN = import.meta.env.DEV
  ? "http://localhost:10000"
  : window.location.origin;

/**
 * Construye rutas absolutas para las llamadas fetch del frontend.
 *
 * @param {string} path Ruta de API que empieza por "/", por ejemplo "/api/v2/citys-stats".
 * @returns {string} URL absoluta contra Express o contra el origen desplegado.
 */
export function apiPath(path) {
  return `${API_ORIGIN}${path}`;
}
