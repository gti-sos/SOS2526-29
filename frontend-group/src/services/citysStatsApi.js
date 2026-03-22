const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v2/citys-stats"
    : "/api/v2/citys-stats";
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
        const message =
            data?.error ||
            "Ha ocurrido un error al comunicarse con el servidor.";
        throw new Error(message);
    }

    return data;
}

export async function getAllCitysStats() {
    const response = await fetch(API_BASE);
    return handleResponse(response);
}

export async function createCityStat(cityStat) {
    const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityStat)
    });
    return handleResponse(response);
}

export async function deleteAllCitysStats() {
    const response = await fetch(API_BASE, {
        method: "DELETE"
    });
    return handleResponse(response);
}

export async function deleteCityStat(city, country) {
    const response = await fetch(`${API_BASE}/${city}/${country}`, {
        method: "DELETE"
    });
    return handleResponse(response);
}

export async function getOneCityStat(city, country) {
    const response = await fetch(`${API_BASE}/${city}/${country}`);
    return handleResponse(response);
}

export async function updateCityStat(city, country, cityStat) {
    const response = await fetch(`${API_BASE}/${city}/${country}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityStat)
    });
    return handleResponse(response);
}