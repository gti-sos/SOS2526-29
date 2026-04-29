// Navega dentro de la SPA usando History API y notifica al router.
export function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Reemplaza la URL actual sin crear nueva entrada de historial.
export function replace(path) {
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Vuelve a la ruta anterior.
export function back() {
  window.history.back();
}
