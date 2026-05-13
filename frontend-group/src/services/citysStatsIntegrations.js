/**
 * Cliente de frontend para las integraciones de citys-stats.
 *
 * Este modulo solo lo usa la pagina de integraciones. Apunta a /api/v1/citys-stats
 * porque en esa version estan los endpoints proxy que combinan datos locales con
 * Open-Meteo, REST Countries, World Bank y APIs SOS externas.
 *
 * FLUJO ASINCRONO:
 * 1. La pagina de integraciones llama a una funcion exportada de este servicio.
 * 2. La funcion construye la URL del endpoint v1 correspondiente.
 * 3. Se ejecuta fetch contra nuestro backend, no directamente contra APIs externas.
 * 4. El backend v1 llama a Open-Meteo, REST Countries, World Bank o APIs SOS.
 * 5. handleResponse lee response.text(), intenta convertirlo a JSON y:
 *    - devuelve datos si la respuesta es correcta.
 *    - lanza Error si el backend respondio con error.
 * 6. La pagina envuelve estas llamadas con safeLoad para que una integracion
 *    fallida no rompa todos los widgets.
 *
 * ORDEN DE USO HABITUAL EN LA PANTALLA:
 * getCitysStatsIntegrationSummary -> pintar widgets.
 * Los endpoints individuales se mantienen para consumo externo y pruebas.
 */
import { apiPath } from "./apiBase.js";

const CITYS_STATS_INTEGRATIONS_API_BASE = apiPath("/api/v1/citys-stats");

/**
 * Procesa una respuesta de integraciones.
 *
 * @param {Response} response Respuesta devuelta por fetch.
 * @returns {Promise<Object|Array|string|null>} Cuerpo parseado de la integracion.
 */
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

/**
 * Obtiene las ciudades con mas poblacion desde la API local.
 *
 * @param {number} limit Numero maximo de ciudades.
 * @returns {Promise<Array>} Ciudades ordenadas por poblacion.
 */
export async function getTopCities(limit = 5) {
    // limit controla cuantas ciudades queremos.
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/top-cities?limit=${limit}`);
    // Procesamos la respuesta.
    return handleResponse(response);
}

/**
 * Obtiene citys-stats agregado por pais desde nuestra API local.
 *
 * @param {number} limit Numero maximo de paises.
 * @returns {Promise<Array>} Resumen agregado por pais.
 */
export async function getCountrySummaries(limit = 8) {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/country-summaries?limit=${limit}`);
    return handleResponse(response);
}

/**
 * Proxy propio a Open-Meteo para geocodificar una ciudad.
 *
 * @param {string} city Ciudad buscada.
 * @param {string} [country] Pais opcional para afinar la busqueda.
 * @returns {Promise<Object>} Datos de geocodificacion normalizados por el backend.
 */
export async function getGeocoding(city, country) {
    const params = country ? `?country=${encodeURIComponent(country)}` : "";
    const response = await fetch(
        `${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/geocoding/${encodeURIComponent(city)}${params}`
    );
    return handleResponse(response);
}

/**
 * Proxy propio a REST Countries para un pais.
 *
 * @param {string} country Pais buscado.
 * @returns {Promise<Object>} Informacion de pais normalizada por el backend.
 */
export async function getCountryInfo(country) {
    const response = await fetch(
        `${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/country/${encodeURIComponent(country)}`
    );
    return handleResponse(response);
}

/**
 * Proxy propio a World Bank para un codigo ISO3.
 *
 * @param {string} countryCode Codigo ISO3 del pais.
 * @returns {Promise<Object>} Poblacion nacional devuelta por World Bank.
 */
export async function getWorldBankPopulation(countryCode) {
    const response = await fetch(
        `${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/world-bank/${encodeURIComponent(countryCode)}`
    );
    return handleResponse(response);
}

/**
 * Proxy propio hacia la API SOS2526-25.
 *
 * @returns {Promise<Array>} Llegadas turisticas externas.
 */
export async function getSosTouristArrivals() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-tourist-arrivals`);
    return handleResponse(response);
}

/**
 * Proxy propio hacia la API SOS2526-19.
 *
 * @returns {Promise<Array>} Datos externos de terremotos.
 */
export async function getSosEarthquakes() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-earthquakes`);
    return handleResponse(response);
}

/**
 * Proxy propio hacia la API SOS2526-26.
 *
 * @returns {Promise<Array>} Valores de plantillas FIFA externos.
 */
export async function getSosFifaSquadValues() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-fifa-squad-values`);
    return handleResponse(response);
}

/**
 * Proxy propio hacia la API SOS2526-30.
 *
 * @returns {Promise<Array>} Premios de eSports externos.
 */
export async function getSosEsportsEarnings() {
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/sos-esports-earnings`);
    return handleResponse(response);
}

/**
 * Obtiene el resumen que combina API local y APIs externas.
 *
 * @param {number} limit Numero maximo de elementos por integracion.
 * @returns {Promise<Object>} Datos ya preparados para los widgets de integraciones.
 */
export async function getCitysStatsIntegrationSummary(limit = 5) {
    // summary integra por pais datos locales, APIs no SOS y APIs SOS externas.
    const response = await fetch(`${CITYS_STATS_INTEGRATIONS_API_BASE}/integrations/summary?limit=${limit}`);
    // Devolvemos el resultado ya procesado.
    return handleResponse(response);
}
