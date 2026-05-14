// Importamos Express, que es la libreria usada para crear el servidor web.
const express = require("express");
// Importamos path para construir rutas de archivos que funcionen en cualquier sistema operativo.
const path = require("path");
// Importamos NeDB, una base de datos sencilla que guarda informacion en archivos locales.
const Datastore = require("@seald-io/nedb");
// Importamos cors para permitir llamadas al backend desde el frontend en desarrollo.
const cors = require("cors");

// Creamos la aplicacion principal de Express.
const app = express();
// Usamos el puerto de Render si existe; si no, usamos 10000 en local.
const port = process.env.PORT || 10000;
// Calculamos una sola vez la ruta al HTML compilado del frontend.
const frontendIndexPath = path.join(__dirname, "public", "index.html");

// Activamos CORS para que el frontend pueda llamar a la API desde otro puerto.
app.use(cors());
// Indicamos a Express que lea cuerpos JSON en peticiones POST y PUT.
app.use(express.json());

// =============================================================================
// FLUJO GENERAL DE EJECUCION
// =============================================================================
// 1. Node ejecuta este archivo de arriba abajo una sola vez al arrancar.
// 2. Se crea la app de Express y se activan middlewares generales:
//    CORS y lectura de JSON.
// 3. Se abren las bases NeDB. autoload carga cada fichero .db.
// 4. Se importan los modulos de API y se ejecutan pasando app y su db.
//    Cada modulo registra sus rutas; no responde peticiones todavia.
// 5. Se registran proxies async para APIs externas:
//    - /api/proxy/drought-stats:
//      fetch externo -> json -> si viene vacio, fetch loadInitialData
//      -> repetir fetch externo -> response.
//    - /api/proxy/age-specific-fertility-rates:
//      fetch externo -> json -> si viene vacio, fetch loadInitialData
//      -> repetir fetch externo -> response.
//    - /api/proxy/exportations-stats:
//      copiar query recibida -> fetch externo -> json -> response.
// 6. Se sirve el frontend compilado desde /public.
// 7. app.listen deja el servidor escuchando. A partir de ahi, Express ejecuta
//    solo el handler que coincida con el metodo y la URL de cada peticion.


// =============================================================================
// 1. CONFIGURACION DE BASES DE DATOS
// =============================================================================

const naturalDisastersDb = new Datastore({
    filename: path.join(__dirname, "src", "back", "natural-disasters.db"),
    autoload: true
});

const citysStatsDb = new Datastore({
    filename: path.join(__dirname, "src", "back", "citys-stats.db"),
    autoload: true
});

const wineStatsDb = new Datastore({
    filename: path.join(__dirname, "src", "back", "wine-stats.db"),
    autoload: true
});


// =============================================================================
// 2. CARGA DE MODULOS DE LA API
// =============================================================================

const naturalDisastersApiV1 = require("./src/back/v1/natural-disasters");
naturalDisastersApiV1(app, naturalDisastersDb);

const naturalDisastersApiV2 = require("./src/back/v2/natural-disasters");
naturalDisastersApiV2(app, naturalDisastersDb);

const citysStatsApiV1 = require("./src/back/v1/citys-stats");
citysStatsApiV1(app, citysStatsDb);

const citysStatsApiV2 = require("./src/back/v2/citys-stats");
citysStatsApiV2(app, citysStatsDb);

const wineStatsApiV1 = require("./src/back/v1/wine-stats");
wineStatsApiV1(app, wineStatsDb);



// =============================================================================
// 3. FRONTEND ESTATICO Y RUTAS DE NAVEGACION
// =============================================================================

app.use("/", express.static(path.join(__dirname, "public")));

app.get("/", (request, response) => {
    response.sendFile(frontendIndexPath);
});

app.get("/about", (request, response) => {
    response.sendFile(frontendIndexPath);
});

// Cualquier ruta del frontend (que no sea /api) devuelve la SPA.
app.get(/^\/(?!api\/).*/, (request, response) => {
    response.sendFile(frontendIndexPath);
});


// =============================================================================
// 5. ARRANQUE DEL SERVIDOR
// =============================================================================

app.listen(port, () => {
    console.log(`>>> Servidor SOS2526-29 listo en puerto ${port}`);
    console.log(`>>> pagina: http://localhost:${port}`);
    console.log(`>>> API ALG: http://localhost:${port}/api/v1/natural-disasters`);
    console.log(`>>> API LCC: http://localhost:${port}/api/v1/citys-stats`);
    console.log(`>>> API RMP: http://localhost:${port}/api/v1/wine-stats`);
    console.log(`>>> API LCC v2: http://localhost:${port}/api/v2/citys-stats`);
    console.log(`>>> API ALG v2: http://localhost:${port}/api/v2/natural-disasters`);
});
