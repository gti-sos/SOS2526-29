




let cool = require("cool-ascii-faces");

"ALGORITMO ALBERTO LIROLA"

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

const { datosVinos, mediaPrecioPorPais } = require('./index-RMP.js');


if (datosFiltrados.length > 0) {

    const totalMuertes = datosFiltrados
        .map(dato => dato.death_count)
        .reduce((suma, muertes) => suma + muertes, 0);


    const mediaMuertes = totalMuertes / datosFiltrados.length;


    console.log(`\n--- Estadísticas de Desastres Naturales ---`);
    console.log(`País analizado: ${paisMuertes}`);
    console.log(`Total de registros encontrados: ${datosFiltrados.length}`);
    console.log(`La media de muertes es de: ${mediaMuertes.toFixed(2)} por registro/década.\n`);
} else {
    console.log(`No se encontraron datos para el país: ${paisMuertes}.`);
}










"RUTA DINÁMICA /COOL Y PAGINA ESTATICA /ABOUT"

// 1. Importaciones (al principio del archivo)
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 10000; // Importante para Render

// 2. PUNTO 6: Configurar la carpeta de archivos estáticos
// Esto le dice a Express que busque archivos en la carpeta "public"
app.use("/", express.static(path.join(__dirname, "public")));

// 3. PUNTO 5: Ruta dinámica /cool
app.get("/cool", (req, res) => {
    res.send(`<html><body><h1>${cool()}</h1></body></html>`);
});

// 4. PUNTO 6: Ruta /about que sirve el archivo HTML
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
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

// POST nuevo vino
app.post(`${BASE_API_URL}/${RECURSORMP}`, (req, res) => {
    const nuevo = req.body;

    if (!nuevo || !nuevo.country || !nuevo.year || !nuevo.price) {
        return res.status(400).json({ error: "Faltan campos obligatorios: country, year, price" });
    }

    const nuevoVino = {
        id: wineStats.length + 1,
        title: nuevo.title,
        country: nuevo.country.toLowerCase(),
        region: nuevo.region ? nuevo.region.toLowerCase() : "",
        year: Number(nuevo.year),
        price: Number(nuevo.price),
        abv: Number(nuevo.abv),
        unit: Number(nuevo.unit),
        grape: nuevo.grape,
        type: nuevo.type,
        capacity: Number(nuevo.capacity)
    };

    wineStats.push(nuevoVino);
    return res.status(201).json(nuevoVino);
});

// PUT actualizar por id
app.put(`${BASE_API_URL}/${RECURSORMP}/:id`, (req, res) => {
    const id = Number(req.params.id);
    const body = req.body;

    if (!body || !body.country || !body.year || !body.price) {
        return res.status(400).json({ error: "Faltan campos obligatorios: country, year, price" });
    }

    const index = wineStats.findIndex(d => d.id === id);
    if (index === -1) {
        return res.status(404).json({ error: `No encontrado vino con id: ${id}` });
    }

    wineStats[index] = {
        id: id,
        title: body.title,
        country: body.country.toLowerCase(),
        region: body.region ? body.region.toLowerCase() : "",
        year: Number(body.year),
        price: Number(body.price),
        abv: Number(body.abv),
        unit: Number(body.unit),
        grape: body.grape,
        type: body.type,
        capacity: Number(body.capacity)
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
















