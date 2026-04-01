

const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v2/natural-disasters"
    : "/api/v2/natural-disasters";

// Obtener todos (con opciones de búsqueda)
export async function getDisasters(searchQuery = "") {
    const res = await fetch(`${API_BASE}${searchQuery}`);
    if (!res.ok) throw new Error("No se pudieron cargar los desastres naturales.");
    return await res.json();
}

// Crear uno nuevo
export async function createDisaster(data) {
    const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (res.status === 409) throw new Error("Ya existe un registro para ese país y año.");
    if (!res.ok) throw new Error("Comprueba que todos los datos numéricos son correctos.");
}

// Borrar todos
export async function deleteAllDisasters() {
    const res = await fetch(API_BASE, { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudieron borrar todos los registros.");
}

// Borrar uno solo
export async function deleteDisaster(country, year) {
    const res = await fetch(`${API_BASE}/${country}/${year}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`No se pudo borrar el registro de ${country} en ${year}.`);
}

// Cargar datos iniciales
export async function loadInitialData() {
    const res = await fetch(`${API_BASE}/loadInitialData`);
    if (res.status === 409) throw new Error("Los datos ya estaban cargados previamente.");
    if (!res.ok) throw new Error("Error al cargar los datos iniciales.");
}

// Obtener un solo registro (Para rellenar el formulario de edición)
export async function getOneDisaster(country, year) {
    const res = await fetch(`${API_BASE}/${country}/${year}`);
    if (!res.ok) throw new Error("No se encontró el registro solicitado.");
    return await res.json();
}

// Actualizar un registro existente
export async function updateDisaster(country, year, data) {
    const res = await fetch(`${API_BASE}/${country}/${year}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Error al actualizar. Comprueba los datos.");
}