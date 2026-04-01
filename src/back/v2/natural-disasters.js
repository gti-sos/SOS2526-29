

module.exports = function (app, db) {
    const BASE_API_URL = "/api/v2/natural-disasters";

    // --- RECURSO: natural-disasters (ALG) ---

    // 1. Redirección a la documentación (Requisito F06)
    app.get(BASE_API_URL + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52437562/2sBXijKBvx"); 
    });

    // 2. Load Initial Data (GET) - Carga 10+ datos si está vacío
    app.get(BASE_API_URL + "/loadInitialData", (req, res) => {
        const initialData = [
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

        console.log("Intentando cargar datos iniciales...");

        db.count({}, (err, count) => {
            if (err) {
                console.error("Error al contar registros:", err);
                return res.sendStatus(500);
            }

            if (count === 0) {
                db.insert(initialData, (err, newDocs) => {
                    if (err) {
                        console.error("ERROR CRÍTICO AL INSERTAR:", err);
                        return res.status(500).send("Error al insertar en la base de datos: " + err);
                    }
                    console.log(`ÉXITO: Se han insertado ${newDocs.length} registros en el archivo.`);
                    res.sendStatus(201);
                });
            } else {
                console.log(`Aviso: La base de datos ya tiene ${count} registros. No se carga nada.`);
                res.status(400).send("La base de datos ya contiene datos.");
            }
        });
    });

    // 3. GET a la colección completa (Búsquedas + Paginación)
    app.get(BASE_API_URL, (req, res) => {

        let query = {};
        
        // Búsquedas (Filtering) - Convertimos a número lo que deba ser número
        if (req.query.country) query.country = new RegExp(req.query.country, 'i');
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.death_count) query.death_count = parseInt(req.query.death_count);
        if (req.query.injured_count) query.injured_count = parseInt(req.query.injured_count);
        if (req.query.economic_damage_usd) query.economic_damage_usd = parseInt(req.query.economic_damage_usd);

        // Paginación
        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 100;

        console.log("Query enviada a NeDB:", query); // <-- CHIVATO 1

    db.find(query).skip(offset).limit(limit).exec((err, docs) => {
        console.log(`Registros encontrados en la DB: ${docs.length}`); // <-- CHIVATO 2
        docs.forEach(d => delete d._id);
        res.json(docs);
    });
});

    // 4. POST a la colección (Crear recurso)
    app.post(BASE_API_URL, (req, res) => {
        const newData = req.body;

        // Validación: Estructura exacta (Requisito F06 - Código 400)
        if (!newData.country || !newData.year || newData.death_count === undefined || 
            newData.injured_count === undefined || newData.economic_damage_usd === undefined ||
            Object.keys(newData).length !== 5) {
            return res.sendStatus(400); 
        }

        // Comprobar si ya existe (Error 409)
        db.findOne({ country: newData.country, year: newData.year }, (err, doc) => {
            if (doc) {
                res.sendStatus(409);
            } else {
                db.insert(newData, (err, newDoc) => {
                    res.sendStatus(201);
                });
            }
        });
    });

    // 5. GET a un recurso concreto (ID compuesto: country/year)
    app.get(BASE_API_URL + "/:country/:year", (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);

        db.findOne({ country: country, year: year }, (err, doc) => {
            if (doc) {
                delete doc._id;
                res.json(doc);
            } else {
                res.sendStatus(404);
            }
        });
    });

    // 6. PUT a un recurso concreto (Actualizar)
    app.put(BASE_API_URL + "/:country/:year", (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;

        // Error 400: El ID de la URL debe coincidir con el del Body
        if (updatedData.country !== country || updatedData.year !== year) {
            return res.sendStatus(400);
        }

        db.update({ country: country, year: year }, { $set: updatedData }, {}, (err, numReplaced) => {
            if (numReplaced === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });

    // 7. DELETE a un recurso concreto
    app.delete(BASE_API_URL + "/:country/:year", (req, res) => {
        const country = req.params.country;
        const year = parseInt(req.params.year);

        db.remove({ country: country, year: year }, {}, (err, numRemoved) => {
            if (numRemoved === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });

    // 8. DELETE a toda la colección (Limpiar)
    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.sendStatus(200);
        });
    });

    // 9. Métodos no permitidos (Error 405)
    app.post(BASE_API_URL + "/:country/:year", (req, res) => res.sendStatus(405));
    app.put(BASE_API_URL, (req, res) => res.sendStatus(405));
};

//test workflow v2