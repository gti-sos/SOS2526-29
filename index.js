




"RUTA DINÁMICA /COOL Y PAGINA ESTATICA /ABOUT"

// 1. Importaciones (al principio del archivo)
const express = require("express");
const path = require("path");
let cool = require("cool-ascii-faces");


const app = express();
app.use(express.json()); // Esto permite que Express entienda el formato JSON en los POST/PUT
const port = process.env.PORT || 10000; // Importante para Render

const { datosVinos, mediaPrecioPorPais } = require('./index-RMP.js');

// 2. PUNTO 6: Configurar la carpeta de archivos estáticos
// Esto le dice a Express que busque archivos en la carpeta "public"
app.use(express.json());

app.use("/", express.static(path.join(__dirname, "public")));

// 3. PUNTO 5: Ruta dinámica /cool
app.get("/cool", (req, res) => {
    res.send(`<html><body><h1>${cool()}</h1></body></html>`);
});

// 4. PUNTO 6: Ruta /about que sirve el archivo HTML
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});




"ALGORITMO ALBERTO LIROLA"

// --- PUNTO 1: Algoritmo de Alberto Lirola (ALG) ---
app.get("/samples/ALG", (req, res) => {
    
    // 1. Tus datos (los mantenemos dentro de la función para este sample)
    const datosDesastres = [
        { country: 'afghanistan', year: 1950, death_count: 215, injured_count: 200, economic_damage_usd: 0 },
        { country: 'afghanistan', year: 1960, death_count: 11, injured_count: 0, economic_damage_usd: 20 },
        { country: 'afghanistan', year: 1970, death_count: 48, injured_count: 16, economic_damage_usd: 5200 },
        { country: 'afghanistan', year: 1980, death_count: 58, injured_count: 352, economic_damage_usd: 26900 },
        { country: 'afghanistan', year: 1990, death_count: 1039, injured_count: 395, economic_damage_usd: 8401 },
        { country: 'afghanistan', year: 2000, death_count: 449, injured_count: 197, economic_damage_usd: 2511 },
        { country: 'afghanistan', year: 2010, death_count: 263, injured_count: 5918, economic_damage_usd: 14800 },
        { country: 'africa', year: 1900, death_count: 1112, injured_count: 0, economic_damage_usd: 0 },
        { country: 'africa', year: 1910, death_count: 8501, injured_count: 0, economic_damage_usd: 0 },
        { country: 'africa', year: 1920, death_count: 2701, injured_count: 0, economic_damage_usd: 0 }
    ];

    const paisMuertes = 'afghanistan';
    const datosFiltrados = datosDesastres.filter(dato => dato.country === paisMuertes);

    // 2. Lógica del algoritmo
    if (datosFiltrados.length > 0) {
        const totalMuertes = datosFiltrados
                            .map(dato => dato.death_count)
                            .reduce((suma, muertes) => suma + muertes, 0);

        const mediaMuertes = totalMuertes / datosFiltrados.length;

        // 3. Respuesta al navegador (Punto clave: usamos response.send)
        // Usamos una plantilla de texto (backticks ``) para que el HTML sea legible
        res.send(`
            <h1>Estadísticas de Desastres Naturales (ALG)</h1>
            <p><strong>País analizado:</strong> ${paisMuertes}</p>
            <p><strong>Total de registros encontrados:</strong> ${datosFiltrados.length}</p>
            <p><strong>La media de muertes es de:</strong> ${mediaMuertes.toFixed(2)} por registro/década.</p>
            <hr>
            <a href="/about">Volver a About</a>
        `);

    } else {
        res.send(`No se encontraron datos para el país: ${paisMuertes}.`);
    }

    console.log("Nueva petición a /samples/ALG");
});


//LCC LUIS CORTES COBOS
app.get("/samples/LCC", (req, res) => {
    const data = [
        { City: "Delhi",     Country: "India", UN_2025_population: 30222405 },
        { City: "Shanghai",  Country: "China", UN_2025_population: 29558908 },
        { City: "Guangzhou", Country: "China", UN_2025_population: 27563372 },
        { City: "Kolkata",   Country: "India", UN_2025_population: 22549738 },
        { City: "Mumbai",    Country: "India", UN_2025_population: 20203056 },
        { City: "Beijing",   Country: "China", UN_2025_population: 17013303 },
        { City: "Shenzhen",  Country: "China", UN_2025_population: 13878396 },
        { City: "Bengaluru", Country: "India", UN_2025_population: 13187098 },
        { City: "Chennai",   Country: "India", UN_2025_population: 11153205 },
        { City: "Hyderabad", Country: "India", UN_2025_population: 9190795 },
        { City: "Suzhou",    Country: "China", UN_2025_population: 7731101 },
        { City: "Ahmedabad", Country: "India", UN_2025_population: 7632408 }
    ];

    const targetCountry = "China";
    const subset = data.filter(row => row.Country === targetCountry);

    if (subset.length === 0) {
        return res.status(200).send(`No hay filas para Country="${targetCountry}"`);
    }

    const avg =
        subset
            .map(row => row.UN_2025_population)
            .reduce((acc, v) => acc + v, 0) / subset.length;

    res.status(200).send(`
        <html>
        <body style="font-family: Arial;">
            <h1>Sample LCC</h1>
            <p><strong>Country analizado:</strong> ${targetCountry}</p>
            <p><strong>Filas usadas:</strong> ${subset.length}</p>
            <p><strong>Media de UN_2025_population:</strong> ${avg}</p>
            <hr>
            <a href="/about">Volver a About</a>
        </body>
        </html>
    `);
});

// API PERSONAL LCC - citys-stats
let citysStats = [];
const BASE_API_URL_LCC = "/api/v1/citys-stats";

app.get(BASE_API_URL_LCC + "/loadInitialData", (req, res) => {
    if (citysStats.length === 0) {
        citysStats = [
            { city: "jakarta", country: "indonesia", un_2025_population: 41913860 },
            { city: "dhaka", country: "bangladesh", un_2025_population: 36585479 },
            { city: "tokyo", country: "japan", un_2025_population: 33412512 },
            { city: "delhi", country: "india", un_2025_population: 30222405 },
            { city: "shanghai", country: "china", un_2025_population: 29558908 },
            { city: "guangzhou", country: "china", un_2025_population: 27563372 },
            { city: "cairo", country: "egypt", un_2025_population: 25566102 },
            { city: "manila", country: "philippines", un_2025_population: 24735305 },
            { city: "kolkata", country: "india", un_2025_population: 22549738 },
            { city: "seoul", country: "south-korea", un_2025_population: 22490482 },
            { city: "karachi", country: "pakistan", un_2025_population: 21422590 },
            { city: "mumbai", country: "india", un_2025_population: 20203056 }
        ];
        return res.status(201).json(citysStats);
    }

    return res.status(200).json(citysStats);
});

// GET colección completa
app.get(BASE_API_URL_LCC, (req, res) => {
    return res.status(200).json(citysStats);
});

// GET recurso concreto por city y country
app.get(BASE_API_URL_LCC + "/:city/:country", (req, res) => {
    const city = req.params.city.toLowerCase();
    const country = req.params.country.toLowerCase();

    const item = citysStats.find(
        d => d.city === city && d.country === country
    );

    if (!item) {
        return res.status(404).json({ error: "Resource not found" });
    }

    return res.status(200).json(item);
});

// POST colección
app.post(BASE_API_URL_LCC, (req, res) => {
    const newData = req.body;

    if (!newData || !newData.city || !newData.country || newData.un_2025_population === undefined) {
        return res.status(400).json({ error: "Bad request" });
    }

    const city = String(newData.city).toLowerCase();
    const country = String(newData.country).toLowerCase();
    const un_2025_population = Number(newData.un_2025_population);

    const exists = citysStats.some(
        d => d.city === city && d.country === country
    );

    if (exists) {
        return res.status(409).json({ error: "Conflict" });
    }

    const item = {
        city,
        country,
        un_2025_population
    };

    citysStats.push(item);
    return res.status(201).json(item);
});

// PUT recurso concreto
app.put(BASE_API_URL_LCC + "/:city/:country", (req, res) => {
    const city = req.params.city.toLowerCase();
    const country = req.params.country.toLowerCase();
    const body = req.body;

    if (!body || !body.city || !body.country || body.un_2025_population === undefined) {
        return res.status(400).json({ error: "Bad request" });
    }

    if (
        String(body.city).toLowerCase() !== city ||
        String(body.country).toLowerCase() !== country
    ) {
        return res.status(400).json({ error: "URL and body do not match" });
    }

    const index = citysStats.findIndex(
        d => d.city === city && d.country === country
    );

    if (index === -1) {
        return res.status(404).json({ error: "Resource not found" });
    }

    citysStats[index] = {
        city,
        country,
        un_2025_population: Number(body.un_2025_population)
    };

    return res.status(200).json(citysStats[index]);
});

// DELETE colección completa
app.delete(BASE_API_URL_LCC, (req, res) => {
    citysStats = [];
    return res.status(200).json([]);
});

// DELETE recurso concreto
app.delete(BASE_API_URL_LCC + "/:city/:country", (req, res) => {
    const city = req.params.city.toLowerCase();
    const country = req.params.country.toLowerCase();

    const index = citysStats.findIndex(
        d => d.city === city && d.country === country
    );

    if (index === -1) {
        return res.status(404).json({ error: "Resource not found" });
    }

    citysStats.splice(index, 1);
    return res.status(200).json({ message: "Deleted" });
});

// POST recurso concreto no permitido
app.post(BASE_API_URL_LCC + "/:city/:country", (req, res) => {
    return res.status(405).json({ error: "Method not allowed" });
});

// PUT colección no permitido
app.put(BASE_API_URL_LCC, (req, res) => {
    return res.status(405).json({ error: "Method not allowed" });
});

//LCC





// Base de datos en memoria para el recurso natural-disasters
let naturalDisasters = [];


const BASE_API_URL_ND = "/api/v1/natural-disasters";

// --- RECURSO: natural-disasters ---

// 2.1 Load Initial Data (GET)
app.get(BASE_API_URL_ND + "/loadInitialData", (req, res) => {
    if (naturalDisasters.length === 0) {
        naturalDisasters = [
            { country: 'afghanistan', year: 1950, death_count: 215, injured_count: 200, economic_damage_usd: 0 },
            { country: 'afghanistan', year: 1960, death_count: 11, injured_count: 0, economic_damage_usd: 20 },
            { country: 'afghanistan', year: 1970, death_count: 48, injured_count: 16, economic_damage_usd: 5200 },
            { country: 'afghanistan', year: 1980, death_count: 58, injured_count: 352, economic_damage_usd: 26900 },
            { country: 'afghanistan', year: 1990, death_count: 1039, injured_count: 395, economic_damage_usd: 8401 },
            { country: 'afghanistan', year: 2000, death_count: 449, injured_count: 197, economic_damage_usd: 2511 },
            { country: 'afghanistan', year: 2010, death_count: 263, injured_count: 5918, economic_damage_usd: 14800 },
            { country: 'africa', year: 1900, death_count: 1112, injured_count: 0, economic_damage_usd: 0 },
            { country: 'africa', year: 1910, death_count: 8501, injured_count: 0, economic_damage_usd: 0 },
            { country: 'africa', year: 1920, death_count: 2701, injured_count: 0, economic_damage_usd: 0 },
            { country: 'spain', year: 2024, death_count: 220, injured_count: 500, economic_damage_usd: 30000 }
        ];
        res.sendStatus(201); // Created
    } else {
        res.status(400).send("Data already initialized");
    }
});

// 2.2 GET a la lista completa
app.get(BASE_API_URL_ND, (req, res) => {
    res.json(naturalDisasters);
});

// 2.3 POST a la lista completa (Crear nuevo)
app.post(BASE_API_URL_ND, (req, res) => {
    const newData = req.body;
    
    // Comprobamos que el cuerpo tiene los campos necesarios
    if (!newData.country || !newData.year || !newData.death_count) {
        return res.sendStatus(400); // Bad Request
    }

    // Comprobar si ya existe (conflicto)
    const exists = naturalDisasters.some(d => d.country === newData.country && d.year === newData.year);
    if (exists) {
        return res.sendStatus(409); // Conflict
    }

    naturalDisasters.push(newData);
    res.sendStatus(201); // Created
});

// 2.4 GET a un recurso concreto (por país y año)
app.get(BASE_API_URL_ND + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const resource = naturalDisasters.find(d => d.country === country && d.year == year);

    if (resource) {
        res.json(resource);
    } else {
        res.sendStatus(404); // Not Found
    }
});

// 2.5 DELETE a un recurso concreto
app.delete(BASE_API_URL_ND + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    naturalDisasters = naturalDisasters.filter(d => !(d.country === country && d.year == year));
    res.sendStatus(200); // OK
});

// 2.6 PUT a un recurso concreto (Actualizar)
app.put(BASE_API_URL_ND + "/:country/:year", (req, res) => {
    const { country, year } = req.params;
    const index = naturalDisasters.findIndex(d => d.country === country && d.year == year);

    if (index !== -1) {
        // Comprobar que el ID del cuerpo coincide con la URL
        if (req.body.country !== country || req.body.year != year) {
            return res.sendStatus(400); // Bad Request
        }
        naturalDisasters[index] = req.body;
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// 2.7 DELETE a la lista completa (Borrar todo)
app.delete(BASE_API_URL_ND, (req, res) => {
    naturalDisasters = [];
    res.sendStatus(200);
});

// 2.8 POST a un recurso concreto (Error 405 - No permitido)
app.post(BASE_API_URL_ND + "/:country/:year", (req, res) => {
    res.sendStatus(405); // Method Not Allowed
});

// 2.9 PUT a la lista completa (Error 405 - No permitido)
app.put(BASE_API_URL_ND, (req, res) => {
    res.sendStatus(405); // Method Not Allowed
});




//RUFINO 
app.get("/samples/RMP", (req, res) => {
    mediaSpain = mediaPrecioPorPais(datosVinos, "Spain")
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

// GET recurso concreto por id
app.get(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    const id = Number(req.params.id);

    const encontrado = wineStats.find(d => d.id === id);

    if (!encontrado) {
        return res.status(404).json({ error: `No encontrado vino con id: ${id}` });
    }

    return res.status(200).json(encontrado);
});

// POST a un recurso concreto NO permitido
// POST /api/v1/wine-stats/:id
app.post(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    return res.status(405).json({
        error: "Método POST no permitido sobre un recurso concreto (usa POST sobre la colección)"
    });
});

// POST nuevo vino
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

    const yaExiste = wineStats.find(v =>
        v.title === String(title) && v.year === Number(year)
    );
    if (yaExiste) {
        return res.status(409).json({
            error: `Ya existe un vino con title="${title}" y year="${year}"`
        });
    }

    const nuevoVino = {
        id:       wineStats.length + 1,
        title:    req.body.title,
        country:  req.body.country.toLowerCase(),
        region:   req.body.region ? req.body.region.toLowerCase() : "",
        year:     Number(req.body.year),
        price:    Number(req.body.price),
        abv:      Number(req.body.abv),
        unit:     Number(req.body.unit),
        grape:    req.body.grape,
        type:     req.body.type,
        capacity: Number(req.body.capacity)
    };

    wineStats.push(nuevoVino);
    return res.status(201).json(nuevoVino);
});

// PUT sobre la colección raíz NO permitido
// PUT /api/v1/wine-stats
app.put(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    return res.status(405).json({
        error: "Método PUT no permitido sobre la colección completa (usa PUT /wine-stats/:id)"
    });
});

// PUT /api/v1/wine-stats/:id (actualizar un vino por id)
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
        id:       id,
        title:    req.body.title,
        country:  req.body.country.toLowerCase(),
        region:   req.body.region ? req.body.region.toLowerCase() : "",
        year:     Number(req.body.year),
        price:    Number(req.body.price),
        abv:      Number(req.body.abv),
        unit:     Number(req.body.unit),
        grape:    req.body.grape,
        type:     req.body.type,
        capacity: Number(req.body.capacity)
    };

    return res.status(200).json(wineStats[index]);
});


// DELETE borrar por id
app.delete(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    const id = Number(req.params.id);

    const index = wineStats.findIndex(d => d.id === id);
    if (index === -1) {
        return res.status(404).json({ error: `No encontrado vino con id: ${id}` });
    }

    wineStats.splice(index, 1);
    return res.status(200).json({ message: `Vino con id: ${id} eliminado` });
});

// DELETE borrar toda la colección
app.delete(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    wineStats = [];
    return res.status(200).json({ message: `Colección ${RECURSORMP} vaciada` });
});



// 5. Arrancar el servidor (al final del archivo)
app.listen(port, () => {
    console.log(`Servidor listo en el puerto ${port}`);
});
















