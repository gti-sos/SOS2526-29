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
const db_RMP = new Datastore({
     filename: path.join(__dirname, "src", "back", "wine-stats.db"),
     autoload: true
 });

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
const wineStatsAPI = require("./src/back/v1/wine-stats");
wineStatsAPI(app,db_RMP)
// =============================================================================
// 3. ESTÁTICOS Y RUTAS DE INFORMACIÓN
// =============================================================================

app.use("/", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
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