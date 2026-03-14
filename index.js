const express = require("express");
const path = require("path");
const Datastore = require("@seald-io/nedb");

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());

// =============================================================================
// 1. CONFIGURACIÓN DE BASES DE DATOS
// =============================================================================

// --- Base de Datos de Alberto (ALG) ---
const db_ND = new Datastore({
    filename: path.join(__dirname, "src", "back", "natural-disasters.db"),
    autoload: true
});

// --- Base de Datos de Luis (LCC) ---
const db_LCC = new Datastore({
    filename: path.join(__dirname, "src", "back", "citys-stats.db"),
    autoload: true
});

// --- Base de Datos de Rufino (RMP) ---
// const db_RMP = new Datastore({
//     filename: path.join(__dirname, "src", "back", "wine-stats.db"),
//     autoload: true
// });

// =============================================================================
// 2. CARGA DE MÓDULOS DE LA API
// =============================================================================

// --- API de Alberto (ALG) ---
const naturalDisastersAPI = require("./src/back/v1/natural-disasters");
naturalDisastersAPI(app, db_ND);

// --- API de Luis (LCC) ---
const citysStatsAPI = require("./src/back/v1/citys-stats");
citysStatsAPI(app, db_LCC);

// --- API de Rufino (RMP) ---
// Cuando Rufino la modularice:
// require("./src/back/v1/wine-stats")(app, db_RMP);

// =============================================================================
// 3. ESTÁTICOS Y RUTAS DE INFORMACIÓN
// =============================================================================

app.use("/", express.static(path.join(__dirname, "public")));

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

// =============================================================================
// 4. CÓDIGO ACTUAL DE RMP (SE MANTIENE TAL CUAL)
// =============================================================================

const { datosVinos, mediaPrecioPorPais } = require("./index-RMP.js");

// Sample RMP
app.get("/samples/RMP", (req, res) => {
    const mediaSpain = mediaPrecioPorPais(datosVinos, "Spain");

    res.send(`
        <html>
        <body style="font-family: Arial;">
            <h1>Algoritmo rmp - Media de precios de vinos</h1>
            <h2>País: Spain</h2>
            <p><strong>Media precio:</strong> ${mediaSpain.toFixed(2)} €</p>
        </body>
        </html>
    `);
});

let wineStats = [];
const BASE_API_URL = "/api/v1";
const RECURSORMP = "wine-stats";

app.get(`${BASE_API_URL}/${RECURSORMP}/loadInitialData`, (req, res) => {
    if (wineStats.length > 0) {
        return res.status(409).json({
            error: `La colección ${RECURSORMP} ya contiene ${wineStats.length} elementos`
        });
    }

    wineStats = datosVinos.map((vino, index) => ({
        id: index + 1,
        title: vino.title,
        country: vino.country.toLowerCase(),
        region: vino.region ? vino.region.toLowerCase() : "",
        year: Number(vino.year),
        price: Number(vino.price),
        abv: Number(vino.abv),
        unit: Number(vino.unit),
        grape: vino.grape,
        type: vino.type,
        capacity: Number(vino.capacity)
    }));

    return res.status(201).json({
        message: `Colección ${RECURSORMP} inicializada`,
        count: wineStats.length
    });
});

app.get(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    return res.status(200).json(wineStats);
});

app.get(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    const id = Number(req.params.id);

    const encontrado = wineStats.find(d => d.id === id);

    if (!encontrado) {
        return res.status(404).json({ error: `No encontrado vino con id: ${id}` });
    }

    return res.status(200).json(encontrado);
});

app.post(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    return res.status(405).json({
        error: "Método POST no permitido sobre un recurso concreto (usa POST sobre la colección)"
    });
});

app.post(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Body vacío o no es JSON" });
    }

    const { title, country, year, price } = req.body;

    if (!title || !country || year === undefined || price === undefined) {
        return res.status(400).json({
            error: "Faltan campos obligatorios: title, country, year, price"
        });
    }

    const yaExiste = wineStats.find(
        v => v.title === String(title) && v.year === Number(year)
    );

    if (yaExiste) {
        return res.status(409).json({
            error: `Ya existe un vino con title="${title}" y year="${year}"`
        });
    }

    const nuevoVino = {
        id: wineStats.length + 1,
        title: req.body.title,
        country: req.body.country.toLowerCase(),
        region: req.body.region ? req.body.region.toLowerCase() : "",
        year: Number(req.body.year),
        price: Number(req.body.price),
        abv: Number(req.body.abv),
        unit: Number(req.body.unit),
        grape: req.body.grape,
        type: req.body.type,
        capacity: Number(req.body.capacity)
    };

    wineStats.push(nuevoVino);
    return res.status(201).json(nuevoVino);
});

app.put(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    return res.status(405).json({
        error: "Método PUT no permitido sobre la colección completa (usa PUT /wine-stats/:id)"
    });
});

app.put(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    const id = Number(req.params.id);

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Body vacío o no es JSON" });
    }

    const { title, country, year, price } = req.body;

    if (!title || !country || year === undefined || price === undefined) {
        return res.status(400).json({
            error: "Faltan campos obligatorios: title, country, year, price"
        });
    }

    if (req.body.id !== undefined && Number(req.body.id) !== id) {
        return res.status(400).json({
            error: `El id del body (${req.body.id}) no coincide con el id de la URL (${id})`
        });
    }

    const index = wineStats.findIndex(v => v.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `No encontrado vino con id: ${id}` });
    }

    wineStats[index] = {
        id: id,
        title: req.body.title,
        country: req.body.country.toLowerCase(),
        region: req.body.region ? req.body.region.toLowerCase() : "",
        year: Number(req.body.year),
        price: Number(req.body.price),
        abv: Number(req.body.abv),
        unit: Number(req.body.unit),
        grape: req.body.grape,
        type: req.body.type,
        capacity: Number(req.body.capacity)
    };

    return res.status(200).json(wineStats[index]);
});

app.delete(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    const id = Number(req.params.id);

    const index = wineStats.findIndex(d => d.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `No encontrado vino con id: ${id}` });
    }

    wineStats.splice(index, 1);
    return res.status(200).json({ message: `Vino con id: ${id} eliminado` });
});

app.delete(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    wineStats = [];
    return res.status(200).json({ message: `Colección ${RECURSORMP} vaciada` });
});

// =============================================================================
// 5. ARRANQUE DEL SERVIDOR
// =============================================================================

app.listen(port, () => {
    console.log(`>>> Servidor SOS2526-29 listo en puerto ${port}`);
    console.log(`>>> API ALG: http://localhost:${port}/api/v1/natural-disasters`);
    console.log(`>>> API LCC: http://localhost:${port}/api/v1/citys-stats`);
    console.log(`>>> API RMP: http://localhost:${port}/api/v1/wine-stats`);
});