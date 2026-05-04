// Importamos Express, que es la libreria usada para crear el servidor web.
const express = require("express");
// Importamos path para construir rutas de archivos que funcionen en cualquier sistema operativo.
const path = require("path");
// Importamos NeDB, una base de datos sencilla que guarda informacion en archivos locales.
const Datastore = require("@seald-io/nedb");
// Importamos cors para permitir llamadas al backend desde el frontend en desarrollo.
const cors = require("cors");

// Estructura alineada con la arquitectura del curso:
// navegador/Svelte -> API REST/Express -> persistencia NeDB e integraciones externas.
// El contrato publico vive bajo /api; el resto de rutas sirven la SPA compilada.

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
// 1. CONFIGURACION DE BASES DE DATOS
// =============================================================================

// Esta base guarda los registros de desastres naturales de Alberto.
const naturalDisastersDb = new Datastore({
    // Guardamos el archivo dentro de src/back para tener los datos junto al backend.
    filename: path.join(__dirname, "src", "back", "natural-disasters.db"),
    // autoload hace que NeDB abra el archivo automaticamente al arrancar.
    autoload: true
});

// Esta base guarda los registros de estadisticas de ciudades de Luis.
const citysStatsDb = new Datastore({
    // El nombre del archivo coincide con el recurso citys-stats.
    filename: path.join(__dirname, "src", "back", "citys-stats.db"),
    // Cargamos la base automaticamente igual que las demas.
    autoload: true
});

// Esta base guarda los registros de vinos de Rufino.
const wineStatsDb = new Datastore({
    // Cada recurso tiene su propio archivo para no mezclar datos.
    filename: path.join(__dirname, "src", "back", "wine-stats.db"),
    // Cargamos el archivo nada mas crear el objeto.
    autoload: true
});

// =============================================================================
// 2. CARGA DE MODULOS DE LA API
// =============================================================================

// Cargamos la API v1 de desastres naturales y le pasamos Express y su base de datos.
const naturalDisastersApiV1 = require("./src/back/v1/natural-disasters");
naturalDisastersApiV1(app, naturalDisastersDb);

// Cargamos la API v2 de desastres naturales usando la misma base de datos.
const naturalDisastersApiV2 = require("./src/back/v2/natural-disasters");
naturalDisastersApiV2(app, naturalDisastersDb);

// Cargamos la API v1 de estadisticas de ciudades.
const citysStatsApiV1 = require("./src/back/v1/citys-stats");
citysStatsApiV1(app, citysStatsDb);

// Cargamos la API v2 de estadisticas de ciudades.
const citysStatsApiV2 = require("./src/back/v2/citys-stats");
citysStatsApiV2(app, citysStatsDb);

// Cargamos la API v1 de vinos.
const wineStatsApiV1 = require("./src/back/v1/wine-stats");
wineStatsApiV1(app, wineStatsDb);

// =============================================================================
// 3. FRONTEND ESTATICO Y RUTAS DE NAVEGACION
// =============================================================================

// Servimos los archivos ya compilados del frontend desde la carpeta public.
app.use("/", express.static(path.join(__dirname, "public")));

// Enviamos el mismo index.html para la portada.
app.get("/", (request, response) => {
    response.sendFile(frontendIndexPath);
});

// Enviamos el mismo frontend para la ruta informativa /about.
app.get("/about", (request, response) => {
    response.sendFile(frontendIndexPath);
});

// Cualquier ruta del frontend (que no sea /api) devuelve la SPA.
app.get(/^\/(?!api\/).*/, (request, response) => {
    response.sendFile(frontendIndexPath);
});

// =============================================================================
// 4. ARRANQUE DEL SERVIDOR
// =============================================================================

// Ponemos el servidor a escuchar peticiones HTTP en el puerto elegido.
app.listen(port, () => {
    // Mostramos por consola la direccion principal del servidor.
    console.log(`>>> Servidor SOS2526-29 listo en puerto ${port}`);
    console.log(`>>> pagina: http://localhost:${port}`);
    // Mostramos la ruta de la API de desastres naturales v1.
    console.log(`>>> API ALG: http://localhost:${port}/api/v1/natural-disasters`);
    // Mostramos la ruta de la API de ciudades v1.
    console.log(`>>> API LCC: http://localhost:${port}/api/v1/citys-stats`);
    // Mostramos la ruta de la API de vinos v1.
    console.log(`>>> API RMP: http://localhost:${port}/api/v1/wine-stats`);
    // Mostramos la ruta de la API de ciudades v2.
    console.log(`>>> API LCC v2: http://localhost:${port}/api/v2/citys-stats`);
    // Mostramos la ruta de la API de desastres naturales v2.
    console.log(`>>> API ALG v2: http://localhost:${port}/api/v2/natural-disasters`);
});
