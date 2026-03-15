// src/back/v1/wine-stats.js

module.exports = (app, db) => {
    const BASE = "/api/v1/wine-stats";

    const DOCS_URL =
        process.env.RMP_DOCS_URL ||
        "https://documenter.getpostman.com/view/33015692/2sBXigMDpp";

    const EXPECTED_FIELDS = ["title", "country", "region", "year", "price", "abv", "unit", "grape", "type", "capacity"];

    const initialData = [
        { title: "The Guv'nor, Spain",                            country: "spain", region: "",                  year: 2026, price: 9.99,  abv: 14,   unit: 105, grape: "Tempranillo", type: "Red",   capacity: 75 },
        { title: "Marqués de Riscal Rioja Reserva 2018/19",       country: "spain", region: "rioja and navarra",  year: 2019, price: 17.99, abv: 14.5, unit: 109, grape: "Tempranillo", type: "Red",   capacity: 75 },
        { title: "The Guv'nor VIP, Spain",                        country: "spain", region: "",                  year: 2026, price: 11.99, abv: 14,   unit: 105, grape: "Tempranillo", type: "Red",   capacity: 75 },
        { title: "The Gathering Storm Red 2022, Spain",           country: "spain", region: "",                  year: 2022, price: 7.99,  abv: 12,   unit: 9,   grape: "Tempranillo", type: "Red",   capacity: 75 },
        { title: "The Guv'nor Rosé, Spain",                       country: "spain", region: "",                  year: 2026, price: 8.99,  abv: 13,   unit: 98,  grape: "Garnacha",    type: "Rosé",  capacity: 75 },
        { title: "Marqués de Cáceres Rioja Gran Reserva 2014/15", country: "spain", region: "rioja and navarra",  year: 2015, price: 22.99, abv: 14.5, unit: 109, grape: "Tempranillo", type: "Red",   capacity: 75 },
        { title: "Vilarnau 'Gaudi' Organic Cava Brut Reserva",    country: "spain", region: "penedès",           year: 2026, price: 13.99, abv: 11.5, unit: 86,  grape: "Macabeo",     type: "White", capacity: 75 },
        { title: "The Guv'nor Blanco, Spain",                     country: "spain", region: "",                  year: 2026, price: 8.99,  abv: 12.5, unit: 93,  grape: "Verdejo",     type: "White", capacity: 75 },
        { title: "The Guv'nor Sparkling, Spain",                  country: "spain", region: "",                  year: 2026, price: 9.99,  abv: 12.5, unit: 94,  grape: "Chardonnay",  type: "White", capacity: 75 },
        { title: "Finca Carelio Tempranillo 2018/19, Spain",      country: "spain", region: "castilla y león",   year: 2019, price: 9.99,  abv: 14.5, unit: 109, grape: "Tempranillo", type: "Red",   capacity: 75 },
    ];

    function isExactBody(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;
        const keys = Object.keys(body).sort();
        const expected = [...EXPECTED_FIELDS].sort();
        return keys.length === expected.length && keys.every((k, i) => k === expected[i]);
    }

    function normalize(body) {
        if (!isExactBody(body)) return null;
        const title    = String(body.title).trim();
        const country  = String(body.country).trim().toLowerCase();
        const region   = body.region ? String(body.region).trim().toLowerCase() : "";
        const year     = Number(body.year);
        const price    = Number(body.price);
        const abv      = Number(body.abv)      || 0;
        const unit     = Number(body.unit)     || 0;
        const grape    = String(body.grape  ?? "").trim();
        const type     = String(body.type   ?? "").trim();
        const capacity = Number(body.capacity) || 0;

        if (!title || !country || !Number.isFinite(year) || !Number.isFinite(price)) return null;
        return { title, country, region, year, price, abv, unit, grape, type, capacity };
    }

    function clean(doc) {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        return rest;
    }

    function nextId(cb) {
        db.find({}, (err, docs) => {
            if (err) return cb(err);
            const max = docs.reduce((m, d) => Math.max(m, d.id || 0), 0);
            cb(null, max + 1);
        });
    }

    // ─── Docs ─────────────────────────────────────────────────────────────────
    app.get(`${BASE}/docs`, (req, res) => {
        res.redirect(DOCS_URL);
    });

    // ─── loadInitialData ──────────────────────────────────────────────────────
    app.get(`${BASE}/loadInitialData`, (req, res) => {
        db.count({}, (err, count) => {
            if (err) return res.sendStatus(500);
            if (count > 0) {
                return res.status(409).json({
                    error: `La colección wine-stats ya contiene ${count} elementos`
                });
            }
            const dataWithIds = initialData.map((v, i) => ({ id: i + 1, ...v }));
            db.insert(dataWithIds, (err2, docs) => {
                if (err2) return res.sendStatus(500);
                return res.status(201).json(docs.map(clean));
            });
        });
    });

    // ─── GET colección (filtros + paginación) ─────────────────────────────────
    app.get(BASE, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);
            let result = docs.map(clean);

            const strFields = ["title", "country", "region", "grape", "type"];
            const numFields = ["id", "year", "price", "abv", "unit", "capacity"];

            for (const field of strFields) {
                if (req.query[field] !== undefined) {
                    result = result.filter(d =>
                        d[field] === String(req.query[field]).trim().toLowerCase()
                    );
                }
            }
            for (const field of numFields) {
                if (req.query[field] !== undefined) {
                    const val = Number(req.query[field]);
                    if (!Number.isFinite(val))
                        return res.status(400).json({ error: `Invalid query param: ${field}` });
                    result = result.filter(d => d[field] === val);
                }
            }

            let offset = 0;
            let limit  = result.length;

            if (req.query.offset !== undefined) {
                offset = Number(req.query.offset);
                if (!Number.isInteger(offset) || offset < 0)
                    return res.status(400).json({ error: "Invalid offset" });
            }
            if (req.query.limit !== undefined) {
                limit = Number(req.query.limit);
                if (!Number.isInteger(limit) || limit < 0)
                    return res.status(400).json({ error: "Invalid limit" });
            }

            return res.status(200).json(result.slice(offset, offset + limit));
        });
    });

    // ─── GET por id ───────────────────────────────────────────────────────────
    app.get(`${BASE}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1)
            return res.status(400).json({ error: "Invalid id" });

        db.findOne({ id }, (err, doc) => {
            if (err)  return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });
            return res.status(200).json(clean(doc));
        });
    });

    // ─── POST sobre recurso concreto → 405 ───────────────────────────────────
    app.post(`${BASE}/:id`, (req, res) => res.sendStatus(405));

    // ─── POST colección ───────────────────────────────────────────────────────
    app.post(BASE, (req, res) => {
        const item = normalize(req.body);
        if (!item) return res.status(400).json({ error: "JSON body does not match expected structure" });

        db.findOne({ title: item.title, year: item.year }, (err, doc) => {
            if (err)  return res.sendStatus(500);
            if (doc)  return res.status(409).json({ error: "Resource already exists" });

            nextId((err2, id) => {
                if (err2) return res.sendStatus(500);
                db.insert({ id, ...item }, (err3, newDoc) => {
                    if (err3) return res.sendStatus(500);
                    return res.status(201).json(clean(newDoc));
                });
            });
        });
    });

    // ─── PUT sobre colección → 405 ────────────────────────────────────────────
    app.put(BASE, (req, res) => res.sendStatus(405));

    // ─── PUT por id ───────────────────────────────────────────────────────────
    app.put(`${BASE}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1)
            return res.status(400).json({ error: "Invalid id" });

        // Si viene id en el body, debe coincidir con el de la URL
        if (req.body.id !== undefined && Number(req.body.id) !== id)
            return res.status(400).json({ error: `El id del body (${req.body.id}) no coincide con el id de la URL (${id})` });

        const { id: _ignored, ...bodyWithoutId } = req.body;
        const item = normalize(bodyWithoutId);
        if (!item) return res.status(400).json({ error: "JSON body does not match expected structure" });

        db.findOne({ id }, (err, doc) => {
            if (err)  return res.sendStatus(500);
            if (!doc) return res.status(404).json({ error: "Resource not found" });

            db.update({ id }, { id, ...item }, {}, (err2) => {
                if (err2) return res.sendStatus(500);
                db.findOne({ id }, (err3, updated) => {
                    if (err3) return res.sendStatus(500);
                    return res.status(200).json(clean(updated));
                });
            });
        });
    });

    // ─── DELETE colección ─────────────────────────────────────────────────────
    app.delete(BASE, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });

    // ─── DELETE por id ────────────────────────────────────────────────────────
    app.delete(`${BASE}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1)
            return res.status(400).json({ error: "Invalid id" });

        db.remove({ id }, {}, (err, numRemoved) => {
            if (err)              return res.sendStatus(500);
            if (numRemoved === 0) return res.status(404).json({ error: "Resource not found" });
            return res.sendStatus(204);
        });
    });
};
