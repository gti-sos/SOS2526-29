// =============================================================================
// API REST v1 para el recurso wine-stats
// =============================================================================
//
// Este modulo registra las rutas de vinos de RMP. El recurso representa vinos
// identificados por un id numerico interno de la API, no por el _id de NeDB.
//
// Flujo general:
// 1. index.js carga este modulo y le pasa app + db.
// 2. Se definen constantes, datos iniciales y funciones auxiliares.
// 3. Se registran rutas Express con app.get/app.post/app.put/app.delete.
// 4. Las rutas no se ejecutan al arrancar; se ejecutan cuando llega la peticion.
module.exports = (app, db) => {

    // Ruta base publica del recurso wine-stats.
    const BASE_API_URL = "/api/v1/wine-stats";
    // URL del portal Postman; se puede sobrescribir desde Render con RMP_DOCS_URL.
    const DOCS_URL =
        process.env.RMP_DOCS_URL ||
        "https://documenter.getpostman.com/view/33015692/2sBXigMDpp";
    // Campos exactos que debe traer el JSON de POST/PUT.
    const EXPECTED_FIELDS = ["title", "country", "region", "year", "price", "abv", "unit", "grape", "type", "capacity"];
    // Campos de texto que se pueden filtrar por query params.
    const TEXT_FILTER_FIELDS = ["title", "country", "region", "grape", "type"];
    // Campos numericos que se pueden filtrar por query params.
    const NUMBER_FILTER_FIELDS = ["id", "year", "price", "abv", "unit", "capacity"];
    // Datos de ejemplo que se insertan con /loadInitialData si la base esta vacia.
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
    //
    // Estos endpoints hacen de intermediarios entre el frontend y APIs externas.
    // El navegador llama a este backend y Express hace el fetch externo, evitando
    // problemas de CORS y devolviendo siempre JSON controlado.


    // Proxy para drought-stats: si la API externa esta vacia intenta loadInitialData.
    app.get("/api/proxy/drought-stats", async (req, res) => {
        try {
            // URL base de la API externa usada por la integracion.
            const baseUrl = "https://sos2526-19-integracion.onrender.com/api/v1/drought-stats";

            // Primera lectura de los datos externos.
            let response = await fetch(baseUrl);
            if (!response.ok) throw new Error(`Error API externa: ${response.status}`);

            // La integracion espera datos JSON.
            let data = await response.json();

            // Si la API externa no tiene datos, intenta inicializarla.
            if (Array.isArray(data) && data.length === 0) {
                const loadResponse = await fetch(`${baseUrl}/loadInitialData`);
                if (!loadResponse.ok) throw new Error(`Error loadInitialData: ${loadResponse.status}`);

                // Despues de cargar iniciales se vuelve a leer para devolver datos reales.
                response = await fetch(baseUrl);
                if (!response.ok) throw new Error(`Error tras loadInitialData: ${response.status}`);

                data = await response.json();
            }

            // Respuesta final que consume el frontend de integraciones.
            res.status(200).json(data);
        } catch (err) {
            // Error comun si falla la API externa o la red.
            res.status(500).json({ error: "No se pudo conectar con la API externa." });
        }
    });


    // Proxy para age-specific-fertility-rates con el mismo patron que el anterior.
    app.get("/api/proxy/age-specific-fertility-rates", async (req, res) => {
        try {
            // URL de la API externa de tasas de fertilidad.
            const baseUrl = "https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates";

            // Fetch servidor-servidor hacia la API externa.
            let response = await fetch(baseUrl);
            if (!response.ok) throw new Error(`Error API externa: ${response.status}`);

            // Parseo JSON obligatorio para cumplir el contrato de integraciones.
            let data = await response.json();

            // Si no hay datos, intenta poblar la API externa y repite la consulta.
            if (Array.isArray(data) && data.length === 0) {
                const loadResponse = await fetch(`${baseUrl}/loadInitialData`);
                if (!loadResponse.ok) throw new Error(`Error loadInitialData: ${loadResponse.status}`);

                response = await fetch(baseUrl);
                if (!response.ok) throw new Error(`Error tras loadInitialData: ${response.status}`);

                data = await response.json();
            }

            // Devuelve JSON al frontend.
            res.status(200).json(data);
        } catch (err) {
            // Respuesta controlada para que la UI pueda mostrar un error entendible.
            res.status(500).json({ error: "No se pudo conectar con la API externa." });
        }
    });


    // =========================================================================
    // HELPERS
    // =========================================================================


    // Comprueba que el body tenga exactamente los campos del recurso, ni mas ni menos.
    function hasExactWineFields(body) {
        // Rechaza null, arrays o tipos que no sean objeto.
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;
        // Compara listas ordenadas para no depender del orden en que venga el JSON.
        const receivedFields = Object.keys(body).sort();
        const expectedFields = [...EXPECTED_FIELDS].sort();
        return receivedFields.length === expectedFields.length &&
            receivedFields.every((field, index) => field === expectedFields[index]);
    }


    // Normaliza un vino recibido por POST/PUT antes de guardarlo en NeDB.
    function normalizeWineStat(body) {
        // Si faltan campos o sobran campos, el recurso es invalido.
        if (!hasExactWineFields(body)) return null;
        // Los textos se limpian y algunos se normalizan a minusculas para filtrar mejor.
        const title    = String(body.title).trim();
        const country  = String(body.country).trim().toLowerCase();
        const region   = body.region ? String(body.region).trim().toLowerCase() : "";
        // Los campos numericos se convierten a Number para guardarlos como numeros reales.
        const year     = Number(body.year);
        const price    = Number(body.price);
        const abv      = Number(body.abv) || 0;
        const unit     = Number(body.unit) || 0;
        const grape    = String(body.grape ?? "").trim();
        const type     = String(body.type ?? "").trim();
        const capacity = Number(body.capacity) || 0;
        // year y price son obligatorios y deben ser numeros validos.
        if (!title || !country || !Number.isFinite(year) || !Number.isFinite(price)) return null;
        return { title, country, region, year, price, abv, unit, grape, type, capacity };
    }


    // Quita el _id autogenerado por NeDB antes de enviar datos por la API.
    function removeDatabaseId(document) {
        if (!document) return document;
        const { _id, ...publicDocument } = document;
        return publicDocument;
    }


    // Calcula el siguiente id publico buscando el id mas alto guardado.
    function getNextWineId(callback) {
        db.find({}, (error, documents) => {
            if (error) return callback(error);
            // Si no hay documentos, maxId queda en 0 y el primer id sera 1.
            const maxId = documents.reduce((max, doc) => Math.max(max, doc.id || 0), 0);
            return callback(null, maxId + 1);
        });
    }


    // Aplica filtros exactos sobre campos de texto como country, region o type.
    function applyTextFilters(items, query) {
        let filtered = items;
        for (const field of TEXT_FILTER_FIELDS) {
            if (query[field] !== undefined) {
                // La comparacion se hace en minusculas para que el filtro sea estable.
                const val = String(query[field]).trim().toLowerCase();
                filtered = filtered.filter(item => String(item[field]).toLowerCase() === val);
            }
        }
        return filtered;
    }


    // Aplica filtros exactos sobre campos numericos y detecta parametros invalidos.
    function applyNumberFilters(items, query) {
        let filtered = items;
        for (const field of NUMBER_FILTER_FIELDS) {
            if (query[field] !== undefined) {
                const num = Number(query[field]);
                // Si el filtro numerico no es numero, la API debe responder 400.
                if (!Number.isFinite(num)) return { error: `Invalid query param: ${field}`, items: [] };
                filtered = filtered.filter(item => item[field] === num);
            }
        }
        return { error: null, items: filtered };
    }


    // Lee offset y limit de la query para paginar el array ya filtrado.
    function readPagination(query, defaultLimit) {
        let offset = 0;
        let limit = defaultLimit;
        if (query.offset !== undefined) {
            offset = Number(query.offset);
            // offset negativo o decimal no es valido.
            if (!Number.isInteger(offset) || offset < 0) return { error: "Invalid offset", offset: 0, limit: 0 };
        }
        if (query.limit !== undefined) {
            limit = Number(query.limit);
            // limit negativo o decimal no es valido.
            if (!Number.isInteger(limit) || limit < 0) return { error: "Invalid limit", offset: 0, limit: 0 };
        }
        return { error: null, offset, limit };
    }


    // =========================================================================
    // RUTAS WINE-STATS
    // =========================================================================


    // Documentacion publica de la API en Postman.
    app.get(`${BASE_API_URL}/docs`, (req, res) => res.redirect(DOCS_URL));


    // Carga datos iniciales solo si la coleccion esta vacia.
    app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {
        // Primero cuenta documentos para evitar duplicar datos.
        db.count({}, (error, count) => {
            if (error) return res.sendStatus(500);
            // En esta API, si ya hay datos, se informa con 409.
            if (count > 0) return res.status(409).json({ error: `La coleccion wine-stats ya contiene ${count} elementos` });
            // Anade id publico incremental a cada vino inicial.
            const dataWithIds = initialData.map((wine, index) => ({ id: index + 1, ...wine }));
            db.insert(dataWithIds, (insertError, documents) => {
                if (insertError) return res.sendStatus(500);
                return res.status(201).json(documents.map(removeDatabaseId));
            });
        });
    });


    // Lista la coleccion completa con filtros y paginacion opcionales.
    app.get(BASE_API_URL, (req, res) => {
        db.find({}, (error, documents) => {
            if (error) return res.sendStatus(500);
            // Nunca se expone _id al cliente.
            const publicDocs = documents.map(removeDatabaseId);
            // Primero se filtran textos, despues numeros y al final se pagina.
            const textFiltered = applyTextFilters(publicDocs, req.query);
            const numberResult = applyNumberFilters(textFiltered, req.query);
            if (numberResult.error) return res.status(400).json({ error: numberResult.error });
            const pagination = readPagination(req.query, numberResult.items.length);
            if (pagination.error) return res.status(400).json({ error: pagination.error });
            const paginated = numberResult.items.slice(pagination.offset, pagination.offset + pagination.limit);
            return res.status(200).json(paginated);
        });
    });


    // Obtiene un vino concreto por id publico.
    app.get(`${BASE_API_URL}/:id`, (req, res) => {
        const id = Number(req.params.id);
        // El id de la URL debe ser entero positivo.
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
        db.findOne({ id }, (error, document) => {
            if (error) return res.sendStatus(500);
            if (!document) return res.status(404).json({ error: "Resource not found" });
            return res.status(200).json(removeDatabaseId(document));
        });
    });


    // No se permite hacer POST sobre un recurso concreto: se crea en la coleccion.
    app.post(`${BASE_API_URL}/:id`, (req, res) => res.sendStatus(405));


    // Crea un vino nuevo en la coleccion.
    app.post(BASE_API_URL, (req, res) => {
        // Valida y normaliza el JSON recibido.
        const wine = normalizeWineStat(req.body);
        if (!wine) return res.status(400).json({ error: "JSON body does not match expected structure" });
        // Evita duplicados usando title + year como clave logica.
        db.findOne({ title: wine.title, year: wine.year }, (error, existing) => {
            if (error) return res.sendStatus(500);
            if (existing) return res.status(409).json({ error: "Resource already exists" });
            // Calcula el siguiente id y guarda el documento.
            getNextWineId((idError, id) => {
                if (idError) return res.sendStatus(500);
                db.insert({ id, ...wine }, (insertError, newDoc) => {
                    if (insertError) return res.sendStatus(500);
                    return res.status(201).json(removeDatabaseId(newDoc));
                });
            });
        });
    });


    // No se permite PUT sobre la coleccion completa.
    app.put(BASE_API_URL, (req, res) => res.sendStatus(405));


    // Actualiza un vino existente identificado por id.
    app.put(`${BASE_API_URL}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
        // Si el body incluye id, debe coincidir con el id de la URL.
        if (req.body.id !== undefined && Number(req.body.id) !== id) {
            return res.status(400).json({ error: `El id del body (${req.body.id}) no coincide con el id de la URL (${id})` });
        }
        // normalizeWineStat no espera id, por eso se separa antes de validar.
        const { id: ignoredId, ...bodyWithoutId } = req.body;
        void ignoredId;
        const wine = normalizeWineStat(bodyWithoutId);
        if (!wine) return res.status(400).json({ error: "JSON body does not match expected structure" });
        // Primero comprueba que el recurso exista.
        db.findOne({ id }, (error, existing) => {
            if (error) return res.sendStatus(500);
            if (!existing) return res.status(404).json({ error: "Resource not found" });
            // Actualiza manteniendo el mismo id publico.
            db.update({ id }, { id, ...wine }, {}, (updateError) => {
                if (updateError) return res.sendStatus(500);
                // Se relee el documento para devolver al cliente el estado final.
                db.findOne({ id }, (findError, updated) => {
                    if (findError) return res.sendStatus(500);
                    return res.status(200).json(removeDatabaseId(updated));
                });
            });
        });
    });


    // Borra todos los vinos.
    app.delete(BASE_API_URL, (req, res) => {
        db.remove({}, { multi: true }, (error) => {
            if (error) return res.sendStatus(500);
            return res.sendStatus(204);
        });
    });


    // Borra un vino concreto por id.
    app.delete(`${BASE_API_URL}/:id`, (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id" });
        db.remove({ id }, {}, (error, removedCount) => {
            if (error) return res.sendStatus(500);
            // Si NeDB no elimina nada, el recurso no existia.
            if (removedCount === 0) return res.status(404).json({ error: "Resource not found" });
            return res.sendStatus(204);
        });
    });
};
