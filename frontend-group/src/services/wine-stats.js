// Elegimos la URL de la API de vinos segun el entorno.
const WINE_STATS_API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v1/wine-stats"
    : "/api/v1/wine-stats";

// Procesa una respuesta HTTP y devuelve datos o lanza un error.
async function handleResponse(response) {
    // 204 significa que la operacion fue bien pero no hay cuerpo JSON.
    if (response.status === 204) return null;

    // Leemos primero como texto para poder aceptar JSON o texto plano.
    const text = await response.text();
    // Aqui guardaremos el contenido parseado.
    let data = null;

    try {
        // Si el texto es JSON, lo convertimos a objeto.
        data = text ? JSON.parse(text) : null;
    } catch {
        // Si no es JSON, lo dejamos como texto.
        data = text;
    }

    // Si el servidor respondio con error, lanzamos un Error para el componente.
    if (!response.ok) {
        const message = data?.error || "Ha ocurrido un error al comunicarse con el servidor.";
        throw new Error(message);
    }

    // Si todo fue bien, devolvemos los datos.
    return data;
}

// Obtiene todos los vinos.
export async function getAllWineStats() {
    // Pedimos la coleccion completa.
    const response = await fetch(WINE_STATS_API_BASE);
    // Procesamos y devolvemos la respuesta.
    return handleResponse(response);
}

// Crea un vino nuevo.
export async function createWineStat(wineStat) {
    // POST envia el vino en formato JSON.
    const response = await fetch(WINE_STATS_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wineStat)
    });
    // Procesamos la respuesta del servidor.
    return handleResponse(response);
}

// Borra todos los vinos.
export async function deleteAllWineStats() {
    // DELETE sobre la coleccion elimina todos los registros.
    const response = await fetch(WINE_STATS_API_BASE, { method: "DELETE" });
    // Procesamos el codigo 204 o el error.
    return handleResponse(response);
}

// Borra un vino por id.
export async function deleteWineStat(id) {
    // El id va al final de la URL.
    const response = await fetch(`${WINE_STATS_API_BASE}/${id}`, { method: "DELETE" });
    // Procesamos la respuesta.
    return handleResponse(response);
}

// Obtiene un vino por id.
export async function getOneWineStat(id) {
    // Pedimos el recurso concreto.
    const response = await fetch(`${WINE_STATS_API_BASE}/${id}`);
    // Devolvemos el vino o lanzamos error.
    return handleResponse(response);
}

// Actualiza un vino por id.
export async function updateWineStat(id, wineStat) {
    // PUT reemplaza los datos del vino indicado.
    const response = await fetch(`${WINE_STATS_API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wineStat)
    });
    // Procesamos la respuesta de actualizacion.
    return handleResponse(response);
}
