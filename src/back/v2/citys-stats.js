// Este modulo registra la API v2 del recurso citys-stats.
// Sigue el patron REST de las diapositivas: una URL de coleccion
// (/api/v2/citys-stats) y una URL de recurso concreto
// (/api/v2/citys-stats/:city/:country), con CRUD mediante metodos HTTP.
module.exports = (app, db) => {
    // Ruta base de la version 2.
    const BASE_API_URL = "/api/v2/citys-stats";

    // URL de documentacion; permite sobrescribirla con una variable de entorno.
    const DOCS_URL =
        process.env.LCC_DOCS_V2_URL ||
        "https://documenter.getpostman.com/view/52412147/2sBXiqEUAv";

    // Datos de ejemplo que se insertan cuando la coleccion esta vacia.
    const initialData = [
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

    // Quita el campo interno _id que genera NeDB.
    function removeDatabaseId(doc) {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
    }

    // Comprueba que el body tenga exactamente los campos del recurso.
    function hasExactCityFields(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;

        const expected = ["city", "country", "un_2025_population"].sort();
        const keys = Object.keys(body).sort();

        return keys.length === expected.length &&
            keys.every((k, i) => k === expected[i]);
    }

    // Limpia textos, convierte la poblacion a numero y valida el registro.
    function normalizeCityStat(body) {
        if (!hasExactCityFields(body)) return null;

        const city = String(body.city).trim().toLowerCase();
        const country = String(body.country).trim().toLowerCase();
        const un_2025_population = Number(body.un_2025_population);

        if (
            !city ||
            !country ||
            !Number.isInteger(un_2025_population) ||
            un_2025_population <= 0
        ) {
            return null;
        }

        return { city, country, un_2025_population };
    }

    // Redirige a la documentacion de Postman.
    app.get(`${BASE_API_URL}/docs`, (req, res) => {
        res.redirect(DOCS_URL);
    });

    // Carga datos iniciales si la base esta vacia.
    app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {
        db.count({}, (err, count) => {
            if (err) return res.sendStatus(500);

            if (count > 0) {
                db.find({}, (err2, docs) => {
                    if (err2) return res.sendStatus(500);
                    return res.status(200).json(docs.map(removeDatabaseId));
                });
                return;
            }

            db.insert(initialData, (err3, docs) => {
                if (err3) return res.sendStatus(500);
                return res.status(201).json(docs.map(removeDatabaseId));
            });
        });
    });

    // Devuelve la coleccion con filtros, busqueda libre, ordenacion y paginacion.
    app.get(BASE_API_URL, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);

            let result = docs.map(removeDatabaseId);

            // Filtro exacto por ciudad.
            if (req.query.city !== undefined) {
                result = result.filter(
                    d => d.city === String(req.query.city).trim().toLowerCase()
                );
            }

            // Filtro exacto por pais.
            if (req.query.country !== undefined) {
                result = result.filter(
                    d => d.country === String(req.query.country).trim().toLowerCase()
                );
            }

            // Filtro exacto por poblacion.
            if (req.query.un_2025_population !== undefined) {
                const value = Number(req.query.un_2025_population);
                if (!Number.isFinite(value)) {
                    return res.status(400).json({ error: "Invalid query" });
                }
                result = result.filter(d => d.un_2025_population === value);
            }

            // Busqueda libre en ciudad o pais.
            if (req.query.q !== undefined) {
                const q = String(req.query.q).trim().toLowerCase();
                result = result.filter(d =>
                    d.city.includes(q) || d.country.includes(q)
                );
            }

            // Ordenacion por ciudad, pais o poblacion.
            if (req.query.sort !== undefined) {
                const sort = String(req.query.sort).trim();
                let field = sort;
                let direction = 1;

                if (sort.startsWith("-")) {
                    field = sort.slice(1);
                    direction = -1;
                }

                const allowedFields = ["city", "country", "un_2025_population"];

                if (!allowedFields.includes(field)) {
                    return res.status(400).json({ error: "Invalid sort field" });
                }

                result.sort((a, b) => {
                    if (a[field] < b[field]) return -1 * direction;
                    if (a[field] > b[field]) return 1 * direction;
                    return 0;
                });
            }

            // Paginacion: offset salta resultados y limit limita la cantidad.
            let offset = 0;
            let limit = result.length;

            if (req.query.offset !== undefined) {
                offset = Number(req.query.offset);
                if (!Number.isInteger(offset) || offset < 0) {
                    return res.status(400).json({ error: "Invalid offset" });
                }
            }

            if (req.query.limit !== undefined) {
                limit = Number(req.query.limit);
                if (!Number.isInteger(limit) || limit < 0) {
                    return res.status(400).json({ error: "Invalid limit" });
                }
            }

            return res.status(200).json(result.slice(offset, offset + limit));
        });
    });

    // Devuelve un registro concreto por ciudad y pais.
    app.get(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            return res.status(200).json(removeDatabaseId(doc));
        });
    });

    // Crea un nuevo registro de ciudad.
    app.post(BASE_API_URL, (req, res) => {
        const item = normalizeCityStat(req.body);

        if (!item) {
            return res.status(400).json({
                error: "JSON body does not match expected structure"
            });
        }

        db.findOne({ city: item.city, country: item.country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (doc) return res.status(409).json({ error: "Resource already exists" });

            db.insert(item, (err2, newDoc) => {
                if (err2) return res.sendStatus(500);
                return res.status(201).json(removeDatabaseId(newDoc));
            });
        });
    });

    // No se permite POST sobre un registro concreto.
    app.post(`${BASE_API_URL}/:city/:country`, (req, res) => {
        return res.sendStatus(405);
    });

    // No se permite PUT sobre toda la coleccion.
    app.put(BASE_API_URL, (req, res) => {
        return res.sendStatus(405);
    });

    // Actualiza un registro concreto por ciudad y pais.
    app.put(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        const item = normalizeCityStat(req.body);

        if (!item) {
            return res.status(400).json({
                error: "JSON body does not match expected structure"
            });
        }

        if (item.city !== city || item.country !== country) {
            return res.status(400).json({ error: "URL and body do not match" });
        }

        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            db.update({ city, country }, item, {}, (err2) => {
                if (err2) return res.sendStatus(500);

                db.findOne({ city, country }, (err3, updated) => {
                    if (err3) return res.sendStatus(500);
                    return res.status(200).json(removeDatabaseId(updated));
                });
            });
        });
    });

    // Borra todos los registros.
    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });

    // Borra un registro concreto por ciudad y pais.
    app.delete(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        db.remove({ city, country }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) {
                return res.status(404).json({ error: "Resource not found" });
            }

            return res.sendStatus(204);
        });
    });
};
