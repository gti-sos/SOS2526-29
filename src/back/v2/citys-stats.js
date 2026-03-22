module.exports = (app, db) => {
    const BASE_API_URL = "/api/v2/citys-stats";

    const DOCS_URL =
        process.env.LCC_DOCS_V2_URL ||
        "https://luiscortescobos18-2627695.postman.co/workspace/Luis-Cortes's-Workspace~3f1c8763-235a-4d56-8df6-2bb7878555f1/collection/52412147-1cafc0b6-f1e8-421e-8003-b1e5f4f58fc0?action=share&source=copy-link&creator=52412147";

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

    function clean(doc) {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
    }

    function isExactBody(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;

        const expected = ["city", "country", "un_2025_population"].sort();
        const keys = Object.keys(body).sort();

        return keys.length === expected.length &&
            keys.every((k, i) => k === expected[i]);
    }

    function normalize(body) {
        if (!isExactBody(body)) return null;

        const city = String(body.city).trim().toLowerCase();
        const country = String(body.country).trim().toLowerCase();
        const un_2025_population = Number(body.un_2025_population);

        if (!city || !country || !Number.isFinite(un_2025_population)) return null;

        return { city, country, un_2025_population };
    }

    app.get(`${BASE_API_URL}/docs`, (req, res) => {
        res.redirect(DOCS_URL);
    });

    app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {
        db.count({}, (err, count) => {
            if (err) return res.sendStatus(500);

            if (count > 0) {
                db.find({}, (err2, docs) => {
                    if (err2) return res.sendStatus(500);
                    return res.status(200).json(docs.map(clean));
                });
                return;
            }

            db.insert(initialData, (err3, docs) => {
                if (err3) return res.sendStatus(500);
                return res.status(201).json(docs.map(clean));
            });
        });
    });

    app.get(BASE_API_URL, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);

            let result = docs.map(clean);

            if (req.query.city !== undefined) {
                result = result.filter(
                    d => d.city === String(req.query.city).trim().toLowerCase()
                );
            }

            if (req.query.country !== undefined) {
                result = result.filter(
                    d => d.country === String(req.query.country).trim().toLowerCase()
                );
            }

            if (req.query.un_2025_population !== undefined) {
                const value = Number(req.query.un_2025_population);
                if (!Number.isFinite(value)) {
                    return res.status(400).json({ error: "Invalid query" });
                }
                result = result.filter(d => d.un_2025_population === value);
            }

            if (req.query.q !== undefined) {
                const q = String(req.query.q).trim().toLowerCase();
                result = result.filter(d =>
                    d.city.includes(q) || d.country.includes(q)
                );
            }

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

    app.get(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        db.findOne({ city, country }, (err, doc) => {
            if (err) return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            return res.status(200).json(clean(doc));
        });
    });

    app.post(BASE_API_URL, (req, res) => {
        const item = normalize(req.body);

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
                return res.status(201).json(clean(newDoc));
            });
        });
    });

    app.post(`${BASE_API_URL}/:city/:country`, (req, res) => {
        return res.sendStatus(405);
    });

    app.put(BASE_API_URL, (req, res) => {
        return res.sendStatus(405);
    });

    app.put(`${BASE_API_URL}/:city/:country`, (req, res) => {
        const city = req.params.city.trim().toLowerCase();
        const country = req.params.country.trim().toLowerCase();

        const item = normalize(req.body);

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
                    return res.status(200).json(clean(updated));
                });
            });
        });
    });

    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });

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