const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:10000/api/v1/wine-stats"
    : "/api/v1/wine-stats";

async function handleResponse(response) {
    if (response.status === 204) return null;

    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        const message = data?.error || "Ha ocurrido un error al comunicarse con el servidor.";
        throw new Error(message);
    }

    return data;
}

export async function getAllWineStats() {
    const response = await fetch(API_BASE);
    return handleResponse(response);
}

export async function createWineStat(wineStat) {
    const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wineStat)
    });
    return handleResponse(response);
}

export async function deleteAllWineStats() {
    const response = await fetch(API_BASE, { method: "DELETE" });
    return handleResponse(response);
}

export async function deleteWineStat(id) {
    const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    return handleResponse(response);
}

export async function getOneWineStat(id) {
    const response = await fetch(`${API_BASE}/${id}`);
    return handleResponse(response);
}

export async function updateWineStat(id, wineStat) {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wineStat)
    });
    return handleResponse(response);
}
