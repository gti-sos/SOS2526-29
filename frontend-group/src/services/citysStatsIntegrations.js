// Elegimos la API v1 porque ahi estan las rutas de integraciones externas.
const CITYS_STATS_INTEGRATIONS_API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v1/citys-stats"
    : "/api/v1/citys-stats";

// Procesa una respuesta de integraciones.
async function handleResponse(response) {
    // Leemos el cuerpo como texto para soportar JSON y texto plano.
    const text = await response.text();
    // Variable donde guardamos el contenido convertido.
    let data = null;

    try {
        // Intentamos convertir el texto a JSON.
        data = text ? JSON.parse(text) : null;
    } catch {
        // Si no era JSON, usamos el texto tal cual.
        data = text;
    }

    // Si la API devuelve error, lanzamos un Error con mensaje.
    if (!response.ok) {
        throw new Error(data?.error || "No se pudieron cargar las integraciones.");
    }

    // Si todo va bien, devolvemos los datos.
    return data;
}

// Obtiene las ciudades con mas poblacion desde la API local.
export async function getTopCities(limit = 5) {
    // limit controla cuantas ciudades queremos.
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/top-cities?limit=${limit}`);
    // Procesamos la respuesta.
    return handleResponse(response);
}

// Obtiene el resumen que combina API local y APIs externas.
export async function getCitysStatsIntegrationSummary(limit = 5) {
    // summary llama a Open-Meteo, REST Countries y World Bank desde el backend.
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/summary?limit=${limit}`);
    // Devolvemos el resultado ya procesado.
    return handleResponse(response);
}
