/**
 * Punto comun para construir URLs del backend.
 *
 * En desarrollo la app Svelte se sirve con Vite, pero la API real vive en
 * Express en el puerto 10000. En produccion frontend y backend comparten
 * origen, por eso se usa window.location.origin.
 *
 * Si preguntan por proxy en la defensa:
 * - En produccion se llama al mismo dominio de Render.
 * - En desarrollo esta constante apunta directamente a Express.
 * - El proxy de Vite existe por si se usan rutas relativas /api.
 */
export const API_ORIGIN = import.meta.env.DEV
  // import.meta.env.DEV es true cuando se ejecuta `npm run dev` en Vite.
  ? "http://localhost:10000"
  // En Render, window.location.origin es https://sos2526-29.onrender.com.
  : window.location.origin;

/**
 * Construye rutas absolutas para las llamadas fetch del frontend.
 *
 * @param {string} path Ruta de API que empieza por "/", por ejemplo "/api/v2/citys-stats".
 * @returns {string} URL absoluta contra Express o contra el origen desplegado.
 */
export function apiPath(path) {
  // Une el origen elegido con la ruta concreta de API.
  // Ejemplo: http://localhost:10000 + /api/v2/citys-stats.
  return `${API_ORIGIN}${path}`;
}
