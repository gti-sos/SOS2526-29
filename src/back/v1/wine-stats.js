module.exports = (app, db) => {

    const BASE_API_URL = "/api/v1/wine-stats";
    const DOCS_URL =
        process.env.RMP_DOCS_URL ||
        "https://documenter.getpostman.com/view/33015692/2sBXigMDpp";
    const EXPECTED_FIELDS = ["title", "country", "region", "year", "price", "abv", "unit", "grape", "type", "capacity"];
    const TEXT_FILTER_FIELDS = ["title", "country", "region", "grape", "type"];
    const NUMBER_FILTER_FIELDS = ["id", "year", "price", "abv", "unit", "capacity"];
    const initialData = [
        { title: "The Guv'nor, Spain", country: "spain", region: "", year: 2026, price: 9.99, abv: 14, unit: 105, grape: "Tempranillo", type: "Red", capacity: 75 },
        { title: "Marqués de Riscal Rioja Reserva 2018/19", country: "spain", region: "rioja and navarra", year: 2019, price: 17.99, abv: 14.5, unit: 109, grape: "Tempranillo", type: "Red", capacity: 75 },
        { title: "The Guv'nor VIP, Spain", country: "spain", region: "", year: 2026, price: 11.99, abv: 14, unit: 105, grape: "Tempranillo", type: "Red", capacity: 75 },
        { title: "The Gathering Storm Red 2022, Spain", country: "spain", region: "", year: 2022, price: 7.99, abv: 12, unit: 9, grape: "Tempranillo", type: "Red", capacity: 75 },
        { title: "The Guv'nor Rosé, Spain", country: "spain", region: "", year: 2026, price: 8.99, abv: 13, unit: 98, grape: "Garnacha", type: "Rosé", capacity: 75 },
        { title: "Marqués de Cáceres Rioja Gran Reserva 2014/15", country: "spain", region: "rioja and navarra", year: 2015, price: 22.99, abv: 14.5, unit: 109, grape: "Tempranillo", type: "Red", capacity: 75 },
        { title: "Vilarnau 'Gaudi' Organic Cava Brut Reserva", country: "spain", region: "penedès", year: 2026, price: 13.99, abv: 11.5, unit: 86, grape: "Macabeo", type: "White", capacity: 75 },
        { title: "The Guv'nor Blanco, Spain", country: "spain", region: "", year: 2026, price: 8.99, abv: 12.5, unit: 93, grape: "Verdejo", type: "White", capacity: 75 },
        { title: "The Guv'nor Sparkling, Spain", country: "spain", region: "", year: 2026, price: 9.99, abv: 12.5, unit: 94, grape: "Chardonnay", type: "White", capacity: 75 },
        { title: "Finca Carelio Tempranillo 2018/19, Spain", country: "spain", region: "castilla y león", year: 2019, price: 9.99, abv: 14.5, unit: 109, grape: "Tempranillo", type: "Red", capacity: 75 }
    ];


    // =========================================================================
    // PROXIES PARA APIS EXTERNAS
    // =========================================================================


    app.get("/api/proxy/drought-stats", async (req, res) => {
        try {
            const baseUrl = "https://sos2526-19-integracion.onrender.com/api/v1/drought-stats";

            let response = await fetch(baseUrl);
            if (!response.ok) throw new Error(`Error API externa: ${response.status}`);

            let data = await response.json();

            if (Array.isArray(data) && data.length === 0) {
                const loadResponse = await fetch(`${baseUrl}/loadInitialData`);
                if (!loadResponse.ok) throw new Error(`Error loadInitialData: ${loadResponse.status}`);

                response = await fetch(baseUrl);
                if (!response.ok) throw new Error(`Error tras loadInitialData: ${response.status}`);

                data = await response.json();
            }

            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: "No se pudo conectar con la API externa." });
        }
    });


    app.get("/api/proxy/age-specific-fertility-rates", async (req, res) => {
        try {
            const baseUrl = "https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates";

            let response = await fetch(baseUrl);
            if (!response.ok) throw new Error(`Error API externa: ${response.status}`);

            let data = await response.json();

            if (Array.isArray(data) && data.length === 0) {
                const loadResponse = await fetch(`${baseUrl}/loadInitialData`);
                if (!loadResponse.ok) throw new Error(`Error loadInitialData: ${loadResponse.status}`);

                response = await fetch(baseUrl);
                if (!response.ok) throw new Error(`Error tras loadInitialData: ${response.status}`);

                data = await response.json();
            }

            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: "No se pudo conectar con la API externa." });
        }
    });


    // =========================================================================
    // HELPERS
    // =========================================================================


    function hasExactWineFields(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;
        const receivedFields = Object.keys(body).sort();
        const expectedFields = [...EXPECTED_FIELDS].sort();
        return receivedFields.length === expectedFields.length &&
            receivedFields.every((field, index) => field === expectedFields[index]);
    }


    function normalizeWineStat(body) {
        if (!hasExactWineFields(body)) return null;
        const title    = String(body.title).trim();
        const country  = String(body.country).trim().toLowerCase();
        const region   = body.region ? String(body.region).trim().toLowerCase() : "";
        const year     = Number(body.year);
        const price    = Number(body.price);
        const abv      = Number(body.abv) || 0;
        const unit     = Number(body.unit) || 0;
        const grape    = String(body.grape ?? "").trim();
        const type     = String(body.type ?? "").trim();
        const capacity = Number(body.capacity) || 0;
        if (!title || !country || !Number.isFinite(year) || !Number.isFinite(price)) return null;
        return { title, country, region, year, price, abv, unit, grape, type, capacity };
    }


    function removeDatabaseId(document) {
        if (!document) return document;
        const { _id, ...publicDocument } = document;
        return publicDocument;
    }


    function getNextWineId(callback) {
        db.find({}, (error, documents) => {
            if (error) return callback(error);
            const maxId = documents.reduce((max, doc) => Math.max(max, doc.id || 0), 0);
            return callback(null, maxId + 1);
        });
    }


    function applyTextFilters(items, query) {
        let filtered = items;
        for (const field of TEXT_FILTER_FIELDS) {
            if (query[field] !== undefined) {
                const val = String(query[field]).trim().toLowerCase();
                filtered = filtered.filter(item => String(item[field]).toLowerCase() === val);
            }
        }
        return filtered;
    }


    function applyNumberFilters(items, query) {
        let filtered = items;
        for (const field of NUMBER_FILTER_FIELDS) {
            if (query[field] !== undefined) {
                const num = Number(query[field]);
                if (!Number.isFinite(num)) return { error: `Invalid query param: ${field}`, items: [] };
                filtered = filtered.filter(item => item[field] === num);
            }
        }
        return { error: null, items: filtered };
    }


    function readPagination(query, defaultLimit) {
        let offset = 0;
        let limit = defaultLimit;
        if (query.offset !== undefined) {
            offset = Number(query.offset);
            if (!Number.isInteger(offset) || offset < 0) return { error: "Invalid offset", offset: 0, limit: 0 };
        }
        if (query.limit !== undefined) {
            limit = Number(query.limit);
            if (!Number.isInteger(limit) || limit < 0) return { error: "Invalid limit", offset: 0, limit: 0 };
        }
        return { error: null, offset, limit };
    }


    // =========================================================================
    // RUTAS WINE-STATS
    // =========================================================================


    app.get(`${BASE_API_URL}/docs`, (req, res) => res.redirect(DOCS_URL));


    app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {
        db.count({}, (error, count) => {
            if (error) return res.sendStatus(500);
            if (count > 0) return res.status(409).json({ error: `La coleccion wine-stats ya contiene ${count} elementos` });
            const dataWithIds = initialData.map((wine, index) => ({ id: index + 1, ...wine }));
            db.insert(dataWithIds, (insertError, documents) => {
                if (insertError) return res.sendStatus(500);
                return res.status(201).json(documents.map(removeDatabaseId));
            });
        });
    });


    app.get(BASE_API_URL, (req, res) => {
        db.find({}, (error, documents) => {
            if (error) return res.sendStatus(500);
            const publicDocs = documents.map(removeDatabaseId);
            const textFiltered = applyTextFilters(publicDocs, req.query);
            const numberResult = applyNumberFilters(textFiltered, req.query);
            if (numberResult.error) return res.status(400).json({ error: numberResult.error });
            const pagination = readPagination(req.query, numberResult.items.length);
            if (pagination.error) return res.status(400).json({ error: pagination.error });
            const paginated = numberResult.items.slice(pagination.offset, pagination.offset + pagination.limit);
            return res.status(200).json(paginated);
        });
    });


    app.get(`${BASE_API_URL}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
        db.findOne({ id }, (error, document) => {
            if (error) return res.sendStatus(500);
            if (!document) return res.status(404).json({ error: "Resource not found" });
            return res.status(200).json(removeDatabaseId(document));
        });
    });


    app.post(`${BASE_API_URL}/:id`, (req, res) => res.sendStatus(405));


    app.post(BASE_API_URL, (req, res) => {
        const wine = normalizeWineStat(req.body);
        if (!wine) return res.status(400).json({ error: "JSON body does not match expected structure" });
        db.findOne({ title: wine.title, year: wine.year }, (error, existing) => {
            if (error) return res.sendStatus(500);
            if (existing) return res.status(409).json({ error: "Resource already exists" });
            getNextWineId((idError, id) => {
                if (idError) return res.sendStatus(500);
                db.insert({ id, ...wine }, (insertError, newDoc) => {
                    if (insertError) return res.sendStatus(500);
                    return res.status(201).json(removeDatabaseId(newDoc));
                });
            });
        });
    });


    app.put(BASE_API_URL, (req, res) => res.sendStatus(405));


    app.put(`${BASE_API_URL}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
        if (req.body.id !== undefined && Number(req.body.id) !== id) {
            return res.status(400).json({ error: `El id del body (${req.body.id}) no coincide con el id de la URL (${id})` });
        }
        const { id: ignoredId, ...bodyWithoutId } = req.body;
        void ignoredId;
        const wine = normalizeWineStat(bodyWithoutId);
        if (!wine) return res.status(400).json({ error: "JSON body does not match expected structure" });
        db.findOne({ id }, (error, existing) => {
            if (error) return res.sendStatus(500);
            if (!existing) return res.status(404).json({ error: "Resource not found" });
            db.update({ id }, { id, ...wine }, {}, (updateError) => {
                if (updateError) return res.sendStatus(500);
                db.findOne({ id }, (findError, updated) => {
                    if (findError) return res.sendStatus(500);
                    return res.status(200).json(removeDatabaseId(updated));
                });
            });
        });
    });


    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (error) => {
            if (error) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });


    app.delete(`${BASE_API_URL}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
        db.remove({ id }, {}, (error, removedCount) => {
            if (error) return res.sendStatus(500);
            if (removedCount === 0) return res.status(404).json({ error: "Resource not found" });
            return res.sendStatus(204);
        });
    });
};