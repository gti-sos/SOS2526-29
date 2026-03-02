

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
    res.send("<html><body><pre>(⌐■_■)</pre></body></html>");
});

// 4. PUNTO 6: Ruta /about que sirve el archivo HTML
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

// 5. Arrancar el servidor (al final del archivo)
app.listen(port, () => {
    console.log(`Servidor listo en el puerto ${port}`);
});
















