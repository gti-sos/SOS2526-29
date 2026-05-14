/**
 * Cliente de frontend para la API REST principal de citys-stats.
 *
 * Este modulo lo usan las pantallas de listado, edicion y analytics. Apunta a
 * /api/v2/citys-stats porque ahi estan las operaciones CRUD de la entrega:
 * listar, filtrar, crear, editar, borrar y cargar datos iniciales.
 *
 * FLUJO ASINCRONO:
 * 1. Una pagina Svelte llama a una funcion exportada de este servicio.
 * 2. La funcion prepara URL y metodo HTTP:
 *    buildUrl para coleccion/filtros, encodePathValue para city/country.
 * 3. Se ejecuta fetch contra /api/v2/citys-stats.
 * 4. handleResponse lee response.text(), intenta JSON.parse y decide:
 *    - si response.ok es true, devuelve los datos a la pagina.
 *    - si response.ok es false, lanza Error con friendlyApiMessage.
 * 5. La pagina que llamo al servicio hace await y pinta exito o error.
 *
 * ORDEN DE USO HABITUAL:
 * - Listado/analytics: getAllCitysStats -> fetch GET -> handleResponse.
 * - Crear: createCityStat -> fetch POST -> handleResponse.
 * - Cargar iniciales: loadInitialCitysStats -> fetch GET /loadInitialData.
 * - Borrar todos: deleteAllCitysStats -> fetch DELETE -> handleResponse.
 * - Editar/borrar uno:
 *   encodePathValue(city/country) -> fetch GET/PUT/DELETE del recurso concreto.
 */
import { apiPath } from "./apiBase.js";

const CITYS_STATS_API_BASE = apiPath("/api/v2/citys-stats");

/**
 * Construye una URL completa de la API y anade parametros de busqueda si existen.
 *
 * @param {string} path Subruta dentro de /api/v2/citys-stats.
 * @param {Object} query Parametros de busqueda opcionales.
 * @returns {string} URL absoluta lista para fetch.
 */
function buildUrl(path = "", query = {}) {
    // URL permite manejar rutas y parametros sin concatenar texto a mano.
    const url = new URL(`${CITYS_STATS_API_BASE}${path}`, window.location.origin);

    // Recorremos cada filtro recibido.
    Object.entries(query).forEach(([key, value]) => {
        // Si el valor esta vacio, no lo mandamos a la API.
        if (value === undefined || value === null || value === "") {
            return;
        }

        // Guardamos el parametro en la URL, por ejemplo ?city=tokyo.
        url.searchParams.set(key, value);
    });

    // Devolvemos la URL como texto para usarla en fetch.
    return url.toString();
}

/**
 * Prepara valores que van dentro de la ruta, como ciudad o pais.
 *
 * @param {string|number} value Valor que se va a insertar en la URL.
 * @returns {string} Valor normalizado y codificado.
 */
function encodePathValue(value) {
    // encodeURIComponent evita problemas con espacios, tildes u otros caracteres.
    return encodeURIComponent(String(value).trim().toLowerCase());
}

/**
 * Traduce mensajes tecnicos del backend a textos faciles para el usuario.
 *
 * @param {number} status Codigo HTTP recibido.
 * @param {string} rawMessage Mensaje original del backend.
 * @returns {string} Mensaje listo para mostrar en la interfaz.
 */
function friendlyApiMessage(status, rawMessage) {
    // Usamos switch para tratar cada error conocido.
    switch (rawMessage) {
        case "Invalid query":
            return "Alguno de los filtros no es valido. Revise los datos de la busqueda.";
        case "Invalid sort field":
            return "La opcion elegida para ordenar no es valida.";
        case "Invalid offset":
            return "La posicion inicial debe ser un numero entero igual o mayor que 0.";
        case "Invalid limit":
            return "El numero maximo de resultados debe ser un numero entero igual o mayor que 0.";
        case "JSON body does not match expected structure":
            return "Revise el formulario. Hace falta indicar ciudad, pais y poblacion estimada.";
        case "Invalid country":
            return "El pais indicado no esta soportado. Use un pais real de la lista para evitar errores en las integraciones externas.";
        case "Resource already exists":
            return "Ya existe un registro con esa ciudad y ese pais.";
        case "Resource not found":
            return "No se ha encontrado el registro solicitado.";
        case "URL and body do not match":
            return "No se pudieron guardar los cambios porque la referencia del registro no coincide.";
        default:
            // Los errores 500 suelen significar fallo del servidor.
            if (status >= 500) {
                return "Ahora mismo no se puede completar la operacion. Intentalo de nuevo en unos minutos.";
            }

            // Mensaje general para cualquier otro caso.
            return "Ha ocurrido un problema al comunicarse con el servidor.";
    }
}

/**
 * Procesa una respuesta de fetch y lanza Error si algo fue mal.
 *
 * @param {Response} response Respuesta devuelta por fetch.
 * @returns {Promise<Object|Array|string|null>} Cuerpo parseado o null en respuestas vacias.
 */
async function handleResponse(response) {
    // 204 significa exito sin contenido.
    if (response.status === 204) {
        return null;
    }

    // Leemos el cuerpo como texto para poder aceptar JSON o texto plano.
    const text = await response.text();
    // Aqui guardaremos el cuerpo convertido.
    let data = null;

    try {
        // Si hay texto, intentamos convertirlo a JSON.
        data = text ? JSON.parse(text) : null;
    } catch {
        // Si no era JSON, dejamos el texto tal cual.
        data = text;
    }

    // Si HTTP indica error, lanzamos un Error con mensaje claro.
    if (!response.ok) {
        throw new Error(friendlyApiMessage(response.status, data?.error));
    }

    // Si todo va bien, devolvemos los datos.
    return data;
}

/**
 * Pide todos los registros de ciudades, opcionalmente con filtros.
 *
 * @param {Object} query Filtros, paginacion u ordenacion admitidos por la API.
 * @returns {Promise<Array|Object>} Registros devueltos por el backend.
 */
export async function getAllCitysStats(query = {}) {
    // Llamamos a la API con la URL construida.
    const response = await fetch(buildUrl("", query), { cache: "no-store" });
    // Devolvemos la respuesta ya procesada.
    return handleResponse(response);
}

/**
 * Crea un nuevo registro de ciudad.
 *
 * @param {Object} cityStat Registro con city, country y un_2025_population.
 * @returns {Promise<Object|null>} Registro creado o respuesta del backend.
 */
export async function createCityStat(cityStat) {
    // Enviamos una peticion POST con JSON en el body.
    const response = await fetch(buildUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityStat)
    });
    // Procesamos la respuesta del backend.
    return handleResponse(response);
}

/**
 * Borra todos los registros de ciudades.
 *
 * @returns {Promise<Object|null>} Respuesta del backend o null si no hay cuerpo.
 */
export async function deleteAllCitysStats() {
    // DELETE sobre la coleccion completa borra todos los datos.
    const response = await fetch(buildUrl(), {
        method: "DELETE"
    });
    // Procesamos el resultado.
    return handleResponse(response);
}

/**
 * Carga los datos iniciales de ejemplo cuando la coleccion esta vacia.
 *
 * @returns {Promise<Array|Object|null>} Datos insertados o respuesta informativa.
 */
export async function loadInitialCitysStats() {
    // Esta ruta solo inserta datos si la base esta vacia.
    const response = await fetch(buildUrl("/loadInitialData"), { cache: "no-store" });
    // Devolvemos los datos cargados o el error.
    return handleResponse(response);
}

/**
 * Borra un registro concreto por ciudad y pais.
 *
 * @param {string} city Ciudad del registro.
 * @param {string} country Pais del registro.
 * @returns {Promise<Object|null>} Respuesta del backend o null si no hay cuerpo.
 */
export async function deleteCityStat(city, country) {
    // Codificamos ciudad y pais para usarlos dentro de la URL.
    const response = await fetch(
        buildUrl(`/${encodePathValue(city)}/${encodePathValue(country)}`),
        {
            method: "DELETE"
        }
    );
    // Procesamos la respuesta.
    return handleResponse(response);
}

/**
 * Obtiene un registro concreto por ciudad y pais.
 *
 * @param {string} city Ciudad del registro.
 * @param {string} country Pais del registro.
 * @returns {Promise<Object>} Registro encontrado.
 */
export async function getOneCityStat(city, country) {
    // La API identifica cada ciudad con city + country.
    const response = await fetch(
        buildUrl(`/${encodePathValue(city)}/${encodePathValue(country)}`),
        { cache: "no-store" }
    );
    // Devolvemos el registro encontrado.
    return handleResponse(response);
}

/**
 * Actualiza un registro concreto por ciudad y pais.
 *
 * @param {string} city Ciudad original del registro.
 * @param {string} country Pais original del registro.
 * @param {Object} cityStat Nuevos datos del registro.
 * @returns {Promise<Object|null>} Registro actualizado o respuesta del backend.
 */
export async function updateCityStat(city, country, cityStat) {
    // Enviamos los nuevos datos con PUT.
    const response = await fetch(
        buildUrl(`/${encodePathValue(city)}/${encodePathValue(country)}`),
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cityStat)
        }
    );
    // Procesamos el resultado de la actualizacion.
    return handleResponse(response);
}
