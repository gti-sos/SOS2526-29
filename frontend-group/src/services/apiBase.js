// En desarrollo Vite puede abrirse como localhost o 127.0.0.1.
// En ambos casos la API real sigue estando en Express, puerto 10000.
export const API_ORIGIN = import.meta.env.DEV
  ? "http://localhost:10000"
  : window.location.origin;

// Construye rutas absolutas para que fetch no acabe pidiendo JSON al servidor de Vite.
export function apiPath(path) {
  return `${API_ORIGIN}${path}`;
}
