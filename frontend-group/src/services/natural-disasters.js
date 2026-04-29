// Elegimos la API v2 de desastres en local o en despliegue.
const NATURAL_DISASTERS_API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v2/natural-disasters"
    : "/api/v2/natural-disasters";

// Obtiene desastres naturales, opcionalmente con una query como ?country=spain.
export async function getDisasters(searchQuery = "") {
    // Hacemos una peticion GET a la API.
    const response = await fetch(`${NATURAL_DISASTERS_API_BASE}${searchQuery}`);
    // Si la API responde con error, avisamos al componente.
    if (!response.ok) throw new Error("No se pudieron cargar los desastres naturales.");
    // Convertimos la respuesta JSON en datos de JavaScript.
    return await response.json();
}

// Crea un desastre natural nuevo.
export async function createDisaster(data) {
    // Enviamos los datos por POST en formato JSON.
    const response = await fetch(NATURAL_DISASTERS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    // 409 significa que ya existe un registro con el mismo pais y anio.
    if (response.status === 409) throw new Error("Ya existe un registro para ese pais y anio.");
    // Cualquier otro error indica datos incorrectos o fallo de servidor.
    if (!response.ok) throw new Error("Comprueba que todos los datos numericos son correctos.");
}

// Borra todos los desastres naturales.
export async function deleteAllDisasters() {
    // DELETE sobre la ruta base limpia la coleccion.
    const response = await fetch(NATURAL_DISASTERS_API_BASE, { method: "DELETE" });
    // Si falla, lanzamos un mensaje sencillo.
    if (!response.ok) throw new Error("No se pudieron borrar todos los registros.");
}

// Borra un desastre natural concreto.
export async function deleteDisaster(country, year) {
    // El recurso se identifica por pais y anio.
    const response = await fetch(`${NATURAL_DISASTERS_API_BASE}/${country}/${year}`, { method: "DELETE" });
    // Si no se puede borrar, avisamos al componente.
    if (!response.ok) throw new Error(`No se pudo borrar el registro de ${country} en ${year}.`);
}

// Carga los datos iniciales de ejemplo.
export async function loadInitialData() {
    // Pedimos al backend que inserte datos iniciales.
    const response = await fetch(`${NATURAL_DISASTERS_API_BASE}/loadInitialData`);
    // El backend antiguo usa 400 cuando ya habia datos; dejamos el mensaje generico debajo.
    if (response.status === 409) throw new Error("Los datos ya estaban cargados previamente.");
    // Si la carga falla, avisamos.
    if (!response.ok) throw new Error("Error al cargar los datos iniciales.");
}

// Obtiene un solo desastre para rellenar el formulario de edicion.
export async function getOneDisaster(country, year) {
    // Pedimos el registro identificado por pais y anio.
    const response = await fetch(`${NATURAL_DISASTERS_API_BASE}/${country}/${year}`);
    // Si no existe, lanzamos un error claro.
    if (!response.ok) throw new Error("No se encontro el registro solicitado.");
    // Convertimos el JSON del servidor en objeto.
    return await response.json();
}

// Actualiza un desastre natural existente.
export async function updateDisaster(country, year, data) {
    // PUT reemplaza los datos del recurso concreto.
    const response = await fetch(`${NATURAL_DISASTERS_API_BASE}/${country}/${year}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    // Si la API rechaza la actualizacion, avisamos.
    if (!response.ok) throw new Error("Error al actualizar. Comprueba los datos.");
}
