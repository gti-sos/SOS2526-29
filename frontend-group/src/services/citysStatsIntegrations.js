const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v1/citys-stats"
    : "/api/v1/citys-stats";

async function handleResponse(response) {
    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        throw new Error(data?.error || "No se pudieron cargar las integraciones.");
    }

    return data;
}

export async function getTopCities(limit = 5) {
    const response = await fetch(`${API_BASE}/top-cities?limit=${limit}`);
    return handleResponse(response);
}

export async function getCitysStatsIntegrationSummary(limit = 5) {
    const response = await fetch(`${API_BASE}/integrations/summary?limit=${limit}`);
    return handleResponse(response);
}
