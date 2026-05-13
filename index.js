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
// 3. PROXIES PARA APIS EXTERNAS (evita CORS desde el frontend)
// =============================================================================
// CORS es una proteccion del navegador que puede bloquear llamadas directas del frontend
// a APIs externas. Estos proxies comunes hacen la peticion desde Express y devuelven JSON
// al frontend, de forma que las pantallas de integraciones no dependan de permisos CORS
// del servidor externo.

// -----------------------------------------------------------------------------
// Proxy para la API externa de drought-stats
// -----------------------------------------------------------------------------
app.get("/api/proxy/drought-stats", async (req, res) => {
  try {
    // URL base de la API externa que se quiere consultar
    const baseUrl = "https://sos2526-19-integracion.onrender.com/api/v1/drought-stats";

    // Se hace una petición GET a la API externa
    let response = await fetch(baseUrl);

    // Si la respuesta no es correcta, se lanza un error
    if (!response.ok) {
      throw new Error(`Error API externa: ${response.status}`);
    }

    // Se convierte la respuesta a JSON
    let data = await response.json();

    // Si la API devuelve un array vacío, se intenta cargar datos iniciales
    if (Array.isArray(data) && data.length === 0) {
      // Se llama al endpoint loadInitialData de la API externa
      const loadResponse = await fetch(`${baseUrl}/loadInitialData`);

      // Si la carga inicial falla, se lanza un error
      if (!loadResponse.ok) {
        throw new Error(`Error loadInitialData: ${loadResponse.status}`);
      }

      // Después de cargar los datos iniciales, se vuelve a consultar la API
      response = await fetch(baseUrl);

      // Se comprueba otra vez que la respuesta sea correcta
      if (!response.ok) {
        throw new Error(`Error API externa tras loadInitialData: ${response.status}`);
      }

      // Se actualiza data con los datos ya cargados
      data = await response.json();
    }

    // Si todo ha ido bien, se devuelve la información al frontend
    res.status(200).json(data);
  } catch (err) {
    // Si ocurre cualquier error, se responde con error 500
    res.status(500).json({ error: "No se pudo conectar con la API externa." });
  }
});

// Proxy para la API age-specific-fertility-rates. Sigue el mismo patron:
// leer datos externos, cargar datos iniciales si vienen vacios y devolver JSON.
app.get("/api/proxy/age-specific-fertility-rates", async (req, res) => {
  try {
    // URL base del recurso externo usado por una integracion del grupo.
    const baseUrl = "https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates";

    // Primera lectura de la API externa.
    let response = await fetch(baseUrl);
    if (!response.ok) {
      throw new Error(`Error API externa: ${response.status}`);
    }

    // La respuesta externa se parsea como JSON porque el backlog exige APIs RESTful JSON.
    let data = await response.json();

    // Si la API del companero aun no tiene datos, se intenta inicializarla.
    if (Array.isArray(data) && data.length === 0) {
      const loadResponse = await fetch(`${baseUrl}/loadInitialData`);
      if (!loadResponse.ok) {
        throw new Error(`Error loadInitialData: ${loadResponse.status}`);
      }

      // Tras loadInitialData se consulta de nuevo para devolver datos reales al frontend.
      response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Error API externa tras loadInitialData: ${response.status}`);
      }

      data = await response.json();
    }

    // Se devuelve siempre JSON normalizado al cliente.
    res.status(200).json(data);
  } catch (err) {
    // Si falla la API externa, el frontend recibe un mensaje controlado.
    res.status(500).json({ error: "No se pudo conectar con la API externa." });
  }
}); 

// Proxy para exportations-stats. Conserva los parametros recibidos para permitir filtros.
app.get("/api/proxy/exportations-stats", async (req, res) => {
    try {
        // URL del recurso externo al que se reenviaran los parametros de consulta.
        const targetUrl = new URL("https://sos2526-13.onrender.com/api/v2/exportations-stats");

        // Copia cada query param original, incluyendo parametros repetidos.
        for (const [key, value] of Object.entries(req.query)) {
            if (Array.isArray(value)) {
                value.forEach((item) => targetUrl.searchParams.append(key, item));
            } else if (value !== undefined) {
                targetUrl.searchParams.set(key, value);
            }
        }

        // Fetch servidor-servidor: el navegador solo ve la llamada al proxy local.
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Error API externa: ${response.status}`);
        }

        // Se devuelve el JSON externo sin exponer detalles de CORS al frontend.
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        // Error generico y comprensible para no filtrar detalles internos.
        res.status(500).json({ error: "No se pudo conectar con la API externa." });
    }
});

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
    console.log(`>>> PROXY drought-stats: http://localhost:${port}/api/proxy/drought-stats`);
    console.log(`>>> PROXY age-specific-fertility-rates: http://localhost:${port}/api/proxy/age-specific-fertility-rates`);
    console.log(`>>> PROXY exportations-stats: http://localhost:${port}/api/proxy/exportations-stats`);
});
