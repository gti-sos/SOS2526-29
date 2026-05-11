// Navega dentro de la SPA usando History API y notifica al router.
export function navigate(path) {
  // pushState cambia la URL sin recargar la pagina completa.
  window.history.pushState({}, "", path);
  // El router de App.svelte escucha popstate para resolver la nueva ruta.
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Reemplaza la URL actual sin crear nueva entrada de historial.
export function replace(path) {
  // replaceState cambia la URL actual, pero no anade una entrada al historial.
  window.history.replaceState({}, "", path);
  // Avisamos al router igual que en navigate.
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Vuelve a la ruta anterior.
export function back() {
  // Delega en el historial del navegador.
  window.history.back();
}
