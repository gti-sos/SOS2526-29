// Este modulo registra la API v1 del recurso wine-stats.
module.exports = (app, db) => {
    // Ruta base que comparten todas las rutas de vinos.
    const BASE_API_URL = "/api/v1/wine-stats";
    // URL de Postman; se puede cambiar con una variable de entorno.
    const DOCS_URL =
        process.env.RMP_DOCS_URL ||
        "https://documenter.getpostman.com/view/33015692/2sBXigMDpp";
    // Campos exactos que debe tener cada vino cuando se crea o actualiza.
    const EXPECTED_FIELDS = ["title", "country", "region", "year", "price", "abv", "unit", "grape", "type", "capacity"];
    // Campos de texto que se pueden filtrar con query params.
    const TEXT_FILTER_FIELDS = ["title", "country", "region", "grape", "type"];
    // Campos numericos que se pueden filtrar con query params.
    const NUMBER_FILTER_FIELDS = ["id", "year", "price", "abv", "unit", "capacity"];
    // Datos de ejemplo que se insertan con loadInitialData.
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

    // Comprueba que el body tenga solo los campos permitidos.
    function hasExactWineFields(body) {
        // Rechazamos null, arrays o cualquier valor que no sea objeto.
        if (!body || typeof body !== "object" || Array.isArray(body)) return false;
        // Ordenamos las claves recibidas para poder compararlas facilmente.
        const receivedFields = Object.keys(body).sort();
        // Ordenamos los campos esperados sin modificar el array original.
        const expectedFields = [...EXPECTED_FIELDS].sort();
        // Deben tener la misma longitud y los mismos nombres.
        return receivedFields.length === expectedFields.length &&
            receivedFields.every((field, index) => field === expectedFields[index]);
    }

    // Limpia y valida un vino antes de guardarlo.
    function normalizeWineStat(body) {
        // Si la estructura no es exacta, devolvemos null para responder 400.
        if (!hasExactWineFields(body)) return null;
        // title se guarda como texto manteniendo mayusculas originales.
        const title = String(body.title).trim();
        // country se guarda en minusculas para que las busquedas sean consistentes.
        const country = String(body.country).trim().toLowerCase();
        // region puede estar vacia, por eso se permite "".
        const region = body.region ? String(body.region).trim().toLowerCase() : "";
        // year se convierte a numero.
        const year = Number(body.year);
        // price se convierte a numero.
        const price = Number(body.price);
        // abv es la graduacion; si no se puede convertir, queda en 0 como antes.
        const abv = Number(body.abv) || 0;
        // unit son unidades disponibles; si no se puede convertir, queda en 0.
        const unit = Number(body.unit) || 0;
        // grape es el tipo de uva.
        const grape = String(body.grape ?? "").trim();
        // type es el tipo de vino, por ejemplo Red o White.
        const type = String(body.type ?? "").trim();
        // capacity es la capacidad de la botella en centilitros.
        const capacity = Number(body.capacity) || 0;

        // title, country, year y price son obligatorios para aceptar el registro.
        if (!title || !country || !Number.isFinite(year) || !Number.isFinite(price)) return null;
        // Devolvemos el objeto listo para guardar.
        return { title, country, region, year, price, abv, unit, grape, type, capacity };
    }

    // Quita el campo _id interno que crea NeDB.
    function removeDatabaseId(document) {
        // Si no hay documento, devolvemos el mismo valor.
        if (!document) return document;
        // Copiamos todo menos _id.
        const { _id, ...publicDocument } = document;
        // Devolvemos el objeto publico.
        return publicDocument;
    }

    // Calcula el siguiente id numerico mirando los documentos actuales.
    function getNextWineId(callback) {
        // Leemos todos los vinos para buscar el id mas alto.
        db.find({}, (error, documents) => {
            // Si hay error, avisamos al callback.
            if (error) return callback(error);
            // Calculamos el id maximo actual; si no hay id, usamos 0.
            const maxId = documents.reduce((maximum, document) => Math.max(maximum, document.id || 0), 0);
            // El siguiente id es el maximo mas uno.
            return callback(null, maxId + 1);
        });
    }

    // Aplica filtros de texto exactos sin distinguir mayusculas y minusculas.
    function applyTextFilters(items, query) {
        // Empezamos con la lista recibida.
        let filteredItems = items;
        // Recorremos cada campo filtrable de texto.
        for (const field of TEXT_FILTER_FIELDS) {
            // Solo filtramos si el usuario envio ese parametro.
            if (query[field] !== undefined) {
                // Normalizamos el valor pedido por el usuario.
                const requestedText = String(query[field]).trim().toLowerCase();
                // Dejamos solo los vinos cuyo campo coincide.
                filteredItems = filteredItems.filter((item) =>
                    String(item[field]).toLowerCase() === requestedText
                );
            }
        }
        // Devolvemos la lista filtrada.
        return filteredItems;
    }

    // Aplica filtros numericos exactos.
    function applyNumberFilters(items, query) {
        // Empezamos con la lista recibida.
        let filteredItems = items;
        // Recorremos cada campo filtrable numerico.
        for (const field of NUMBER_FILTER_FIELDS) {
            // Solo filtramos si el usuario envio ese parametro.
            if (query[field] !== undefined) {
                // Convertimos el valor de la URL a numero.
                const requestedNumber = Number(query[field]);
                // Si no es numero valido, avisamos para devolver 400.
                if (!Number.isFinite(requestedNumber)) {
                    return { error: `Invalid query param: ${field}`, items: [] };
                }
                // Dejamos solo los vinos cuyo campo coincide exactamente.
                filteredItems = filteredItems.filter((item) => item[field] === requestedNumber);
            }
        }
        // Devolvemos los datos filtrados sin error.
        return { error: null, items: filteredItems };
    }

    // Lee offset y limit para paginar.
    function readPagination(query, defaultLimit) {
        // offset indica cuantos resultados saltar.
        let offset = 0;
        // limit indica cuantos resultados devolver.
        let limit = defaultLimit;

        // Si offset viene en la URL, debe ser entero y no negativo.
        if (query.offset !== undefined) {
            offset = Number(query.offset);
            if (!Number.isInteger(offset) || offset < 0) {
                return { error: "Invalid offset", offset: 0, limit: 0 };
            }
        }

        // Si limit viene en la URL, debe ser entero y no negativo.
        if (query.limit !== undefined) {
            limit = Number(query.limit);
            if (!Number.isInteger(limit) || limit < 0) {
                return { error: "Invalid limit", offset: 0, limit: 0 };
            }
        }

        // Devolvemos la paginacion validada.
        return { error: null, offset, limit };
    }

    // Redirige a la documentacion de la API.
    app.get(`${BASE_API_URL}/docs`, (request, response) => {
        response.redirect(DOCS_URL);
    });

    // Carga los vinos iniciales si la coleccion esta vacia.
    app.get(`${BASE_API_URL}/loadInitialData`, (request, response) => {
        // Contamos cuantos vinos hay actualmente.
        db.count({}, (error, count) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si ya existen datos, respondemos conflicto como en el codigo original.
            if (count > 0) {
                return response.status(409).json({
                    error: `La coleccion wine-stats ya contiene ${count} elementos`
                });
            }
            // Anadimos ids 1, 2, 3... a los datos iniciales.
            const dataWithIds = initialData.map((wine, index) => ({ id: index + 1, ...wine }));
            // Insertamos los datos en NeDB.
            db.insert(dataWithIds, (insertError, documents) => {
                // Error al insertar.
                if (insertError) return response.sendStatus(500);
                // Devolvemos los documentos creados sin _id.
                return response.status(201).json(documents.map(removeDatabaseId));
            });
        });
    });

    // Devuelve todos los vinos, con filtros y paginacion.
    app.get(BASE_API_URL, (request, response) => {
        // Leemos todos los documentos de la base.
        db.find({}, (error, documents) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Quitamos _id antes de trabajar con los resultados.
            const publicDocuments = documents.map(removeDatabaseId);
            // Aplicamos filtros de texto.
            const textFilteredItems = applyTextFilters(publicDocuments, request.query);
            // Aplicamos filtros numericos.
            const numberFilterResult = applyNumberFilters(textFilteredItems, request.query);

            // Si un filtro numerico no es valido, devolvemos 400.
            if (numberFilterResult.error) {
                return response.status(400).json({ error: numberFilterResult.error });
            }

            // Validamos offset y limit.
            const pagination = readPagination(request.query, numberFilterResult.items.length);

            // Si la paginacion no es valida, devolvemos 400.
            if (pagination.error) {
                return response.status(400).json({ error: pagination.error });
            }

            // Recortamos la lista segun offset y limit.
            const paginatedItems = numberFilterResult.items.slice(
                pagination.offset,
                pagination.offset + pagination.limit
            );
            // Enviamos los datos finales.
            return response.status(200).json(paginatedItems);
        });
    });

    // Devuelve un vino concreto por id.
    app.get(`${BASE_API_URL}/:id`, (request, response) => {
        // Convertimos el id recibido a numero.
        const id = Number(request.params.id);
        // El id debe ser un entero positivo.
        if (!Number.isInteger(id) || id < 1) {
            return response.status(400).json({ error: "Invalid id" });
        }

        // Buscamos el vino por id.
        db.findOne({ id }, (error, document) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si no existe, devolvemos 404.
            if (!document) return response.status(404).json({ error: "Resource not found" });
            // Si existe, lo devolvemos sin _id.
            return response.status(200).json(removeDatabaseId(document));
        });
    });

    // No se permite POST sobre un vino concreto.
    app.post(`${BASE_API_URL}/:id`, (request, response) => response.sendStatus(405));

    // Crea un nuevo vino.
    app.post(BASE_API_URL, (request, response) => {
        // Normalizamos y validamos el body.
        const wine = normalizeWineStat(request.body);
        // Si no cumple la estructura, devolvemos 400.
        if (!wine) return response.status(400).json({ error: "JSON body does not match expected structure" });

        // Evitamos duplicados por titulo y anio.
        db.findOne({ title: wine.title, year: wine.year }, (error, existingWine) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si ya existe, devolvemos conflicto.
            if (existingWine) return response.status(409).json({ error: "Resource already exists" });

            // Calculamos el siguiente id.
            getNextWineId((idError, id) => {
                // Error al calcular id.
                if (idError) return response.sendStatus(500);
                // Insertamos el vino con su id.
                db.insert({ id, ...wine }, (insertError, newDocument) => {
                    // Error al insertar.
                    if (insertError) return response.sendStatus(500);
                    // Devolvemos el vino creado.
                    return response.status(201).json(removeDatabaseId(newDocument));
                });
            });
        });
    });

    // No se permite PUT sobre toda la coleccion.
    app.put(BASE_API_URL, (request, response) => response.sendStatus(405));

    // Actualiza un vino concreto por id.
    app.put(`${BASE_API_URL}/:id`, (request, response) => {
        // Convertimos el id de la URL a numero.
        const id = Number(request.params.id);
        // El id debe ser entero positivo.
        if (!Number.isInteger(id) || id < 1) {
            return response.status(400).json({ error: "Invalid id" });
        }

        // Si el body trae id, debe coincidir con la URL.
        if (request.body.id !== undefined && Number(request.body.id) !== id) {
            return response.status(400).json({ error: `El id del body (${request.body.id}) no coincide con el id de la URL (${id})` });
        }

        // Quitamos id del body porque el id real lo marca la URL.
        const { id: ignoredId, ...bodyWithoutId } = request.body;
        // Evitamos aviso de variable no usada y dejamos claro que se ignora.
        void ignoredId;
        // Validamos el resto del body.
        const wine = normalizeWineStat(bodyWithoutId);
        // Si no es valido, devolvemos 400.
        if (!wine) return response.status(400).json({ error: "JSON body does not match expected structure" });

        // Buscamos si existe el vino a actualizar.
        db.findOne({ id }, (error, existingWine) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si no existe, devolvemos 404.
            if (!existingWine) return response.status(404).json({ error: "Resource not found" });

            // Actualizamos el documento completo manteniendo el mismo id.
            db.update({ id }, { id, ...wine }, {}, (updateError) => {
                // Error al actualizar.
                if (updateError) return response.sendStatus(500);
                // Leemos de nuevo el documento actualizado.
                db.findOne({ id }, (findError, updatedDocument) => {
                    // Error al leer.
                    if (findError) return response.sendStatus(500);
                    // Devolvemos el vino actualizado.
                    return response.status(200).json(removeDatabaseId(updatedDocument));
                });
            });
        });
    });

    // Borra toda la coleccion de vinos.
    app.delete(BASE_API_URL, (request, response) => {
        // multi:true permite borrar todos los documentos.
        db.remove({}, { multi: true }, (error) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Borrado correcto sin contenido.
            return response.sendStatus(204);
        });
    });

    // Borra un vino concreto por id.
    app.delete(`${BASE_API_URL}/:id`, (request, response) => {
        // Convertimos el id a numero.
        const id = Number(request.params.id);
        // El id debe ser entero positivo.
        if (!Number.isInteger(id) || id < 1) {
            return response.status(400).json({ error: "Invalid id" });
        }

        // Eliminamos el documento que tenga ese id.
        db.remove({ id }, {}, (error, removedCount) => {
            // Error de base de datos.
            if (error) return response.sendStatus(500);
            // Si no se borro nada, no existia.
            if (removedCount === 0) return response.status(404).json({ error: "Resource not found" });
            // Borrado correcto sin contenido.
            return response.sendStatus(204);
        });
    });
};
