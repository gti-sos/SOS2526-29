const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v2/citys-stats"
    : "/api/v2/citys-stats";

function buildUrl(path = "", query = {}) {
    const url = new URL(`${API_BASE}${path}`, window.location.origin);

    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        url.searchParams.set(key, value);
    });

    return url.toString();
}

function encodePathValue(value) {
    return encodeURIComponent(String(value).trim().toLowerCase());
}

function friendlyApiMessage(status, rawMessage) {
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
        case "Resource already exists":
            return "Ya existe un registro con esa ciudad y ese pais.";
        case "Resource not found":
            return "No se ha encontrado el registro solicitado.";
        case "URL and body do not match":
            return "No se pudieron guardar los cambios porque la referencia del registro no coincide.";
        default:
            if (status >= 500) {
                return "Ahora mismo no se puede completar la operacion. Intentalo de nuevo en unos minutos.";
            }

            return "Ha ocurrido un problema al comunicarse con el servidor.";
    }
}

async function handleResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        throw new Error(friendlyApiMessage(response.status, data?.error));
    }

    return data;
}

export async function getAllCitysStats(query = {}) {
    const response = await fetch(buildUrl("", query));
    return handleResponse(response);
}

export async function createCityStat(cityStat) {
    const response = await fetch(buildUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityStat)
    });
    return handleResponse(response);
}

export async function deleteAllCitysStats() {
    const response = await fetch(buildUrl(), {
        method: "DELETE"
    });
    return handleResponse(response);
}

export async function loadInitialCitysStats() {
    const response = await fetch(buildUrl("/loadInitialData"));
    return handleResponse(response);
}

export async function deleteCityStat(city, country) {
    const response = await fetch(
        buildUrl(`/${encodePathValue(city)}/${encodePathValue(country)}`),
        {
        method: "DELETE"
        }
    );
    return handleResponse(response);
}

export async function getOneCityStat(city, country) {
    const response = await fetch(
        buildUrl(`/${encodePathValue(city)}/${encodePathValue(country)}`)
    );
    return handleResponse(response);
}

export async function updateCityStat(city, country, cityStat) {
    const response = await fetch(
        buildUrl(`/${encodePathValue(city)}/${encodePathValue(country)}`),
        {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityStat)
        }
    );
    return handleResponse(response);
}
