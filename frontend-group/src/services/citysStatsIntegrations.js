// Elegimos la API v1 porque ahi estan las rutas de integraciones externas.
import { apiPath } from "./apiBase.js";

const CITYS_STATS_INTEGRATIONS_API_BASE = apiPath("/api/v1/citys-stats");

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

// Obtiene citys-stats agregado por pais desde nuestra API local.
export async function getCountrySummaries(limit = 8) {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/country-summaries?limit=${limit}`);
    return handleResponse(response);
}

// Proxy propio a Open-Meteo para una ciudad.
export async function getGeocoding(city, country) {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    const response = await fetch(
        `${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/geocoding/${encodeURIComponent(city)}${params}`
    );
    return handleResponse(response);
}

// Proxy propio a REST Countries para un pais.
export async function getCountryInfo(country) {
    const response = await fetch(
        `${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/country/${encodeURIComponent(country)}`
    );
    return handleResponse(response);
}

// Proxy propio a World Bank para un codigo ISO3.
export async function getWorldBankPopulation(countryCode) {
    const response = await fetch(
        `${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/world-bank/${encodeURIComponent(countryCode)}`
    );
    return handleResponse(response);
}

// Proxy propio hacia la API SOS2526-25.
export async function getSosTouristArrivals() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-tourist-arrivals`);
    return handleResponse(response);
}

// Proxy propio hacia la API SOS2526-19.
export async function getSosEarthquakes() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-earthquakes`);
    return handleResponse(response);
}

// Proxy propio hacia la API SOS2526-26.
export async function getSosFifaSquadValues() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-fifa-squad-values`);
    return handleResponse(response);
}

// Proxy propio hacia la API SOS2526-30.
export async function getSosEsportsEarnings() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-esports-earnings`);
    return handleResponse(response);
}

// Obtiene el resumen que combina API local y APIs externas.
export async function getCitysStatsIntegrationSummary(limit = 5) {
    // summary integra por pais datos locales, APIs no SOS y APIs SOS externas.
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/summary?limit=${limit}`);
    // Devolvemos el resultado ya procesado.
    return handleResponse(response);
}
